import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms, { StringValue } from "ms";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { catchError } from "@middleware/errorHandler";
import { logger } from "@middleware/logger";
import {
	generateAccessToken,
	generateRefreshToken,
} from "@utils/generateToken";
import {
	IAuthLoginInput,
	IAuthLoginOutput,
	IAuthRefreshTokenInput,
	IAuthRefreshTokenOutput,
} from "@interfaces/auth";
import { KonApiContract, TokenPayload } from "@interfaces/common";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
} from "@errors/validation";
import {
	KonInvalidCredentialsError,
	KonInvalidTokenError,
	KonMissingTokenError,
} from "@errors/authentication";
import {
	AUTH_LIMITER_REQUESTS,
	AUTH_LIMITER_WINDOW,
	GENERAL_LIMITER_HIDE_HEADERS,
	REFRESH_TOKEN_EXPIRES_IN,
	REFRESH_TOKEN_SECRET,
} from "@utils/envVariables";
import {
	doubleCsrfProtection,
	generateCsrfToken,
} from "@middleware/csrfConfig";
import cookieParser from "cookie-parser";

const router = Router();

const limiter = rateLimit({
	windowMs: ms(AUTH_LIMITER_WINDOW as StringValue),
	limit: AUTH_LIMITER_REQUESTS,
	standardHeaders: GENERAL_LIMITER_HIDE_HEADERS,
	legacyHeaders: false,
});

router.use(limiter);
router.use(cookieParser());

const cookieMaxAge = ms(REFRESH_TOKEN_EXPIRES_IN as StringValue);

type LoginApiContract = KonApiContract<IAuthLoginInput, IAuthLoginOutput>;
router.post(
	"/login",
	catchError(
		async (req: LoginApiContract["Req"], res: LoginApiContract["Res"]) => {
			const { email, password } = req.body;

			if (!email || !password) {
				throw new KonMissingRequiredFieldsError();
			}

			if (typeof email !== "string" || typeof password !== "string") {
				throw new KonIncorrectFieldTypeError();
			}

			const result = await prisma.administrator.findUnique({
				where: {
					Email: email,
				},
				include: { Condominiums: true },
			});

			if (!result) {
				// Wrong email
				throw new KonInvalidCredentialsError();
			}

			if (!result.PasswordHash) {
				// Account without password
				throw new KonInvalidCredentialsError();
			}

			const isPasswordValid = await bcrypt.compare(
				password,
				result.PasswordHash,
			);

			if (!isPasswordValid) {
				// Wrong password
				throw new KonInvalidCredentialsError();
			}

			const tokenPayload: TokenPayload = {
				administratorId: result.AdministratorID,
				email: result.Email,
			};

			const accessToken = generateAccessToken(tokenPayload);
			const refreshToken = generateRefreshToken(tokenPayload);
			const csrfToken = generateCsrfToken(req, res);

			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: cookieMaxAge,
			});

			res.status(200).json({
				accessToken,
				csrfToken,
				profile: {
					administratorId: result.AdministratorID,
					firstName: result.FirstName,
					lastName: result.LastName,
					email: result.Email,
					condominiums: result.Condominiums.map((c) => ({
						condominiumId: c.CondominiumID,
						name: c.Name,
					})),
				},
			});
		},
	),
);

type RefreshTokenApiContract = KonApiContract<
	IAuthRefreshTokenInput,
	IAuthRefreshTokenOutput
>;
router.post(
	"/refresh-token",
	doubleCsrfProtection,
	catchError(
		async (
			req: RefreshTokenApiContract["Req"],
			res: RefreshTokenApiContract["Res"],
		) => {
			logger.debug(req.cookies, "Request cookies:");
			const refreshToken = req.cookies?.refreshToken;

			if (!refreshToken) {
				throw new KonMissingTokenError("Missing refresh token.");
			}

			try {
				const decoded = jwt.verify(
					refreshToken,
					REFRESH_TOKEN_SECRET,
				) as any;

				const tokenPayload: TokenPayload = {
					administratorId: decoded.administratorId,
					email: decoded.email,
				};

				const newAccessToken = generateAccessToken(tokenPayload);
				const newRefreshToken = generateRefreshToken(tokenPayload);

				res.cookie("refreshToken", newRefreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					maxAge: cookieMaxAge,
				});

				res.status(200).json({
					accessToken: newAccessToken,
				});
			} catch (err) {
				logger.debug({ err }, "Error during verification of JWT.");
				throw new KonInvalidTokenError();
			}
		},
	),
);

export default router;
