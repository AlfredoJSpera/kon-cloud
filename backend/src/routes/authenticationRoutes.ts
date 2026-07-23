import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms, { StringValue } from "ms";
import { Request, Response, Router } from "express";
import { rateLimit } from "express-rate-limit";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandlerMW";
import { logger } from "@middleware/loggerMW";
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
} from "@errors/validationErrors";
import {
	KonInvalidCredentialsError,
	KonInvalidRefreshTokenError,
	KonMissingRefreshTokenError,
} from "@errors/authenticationErrors";
import {
	AUTH_LIMITER_REQUESTS,
	AUTH_LIMITER_WINDOW,
	COOKIE_MAX_AGE,
	GENERAL_LIMITER_HIDE_HEADERS,
	REFRESH_TOKEN_SECRET,
} from "@utils/envVariables";
import {
	doubleCsrfProtection,
	generateCsrfToken,
} from "@middleware/csrfConfigMW";
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

			// Tokens
			const tokenPayload: TokenPayload = {
				administratorId: result.AdministratorID,
				email: result.Email,
			};
			const accessToken = generateAccessToken(tokenPayload);
			const refreshToken = generateRefreshToken(tokenPayload);

			// Cookies
			generateCsrfToken(req, res); // Generates the x-csrf-token cookie
			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				path: "/",
				sameSite: "strict",
				maxAge: COOKIE_MAX_AGE,
			});

			// Response
			res.status(200).json({
				accessToken,
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
router.get(
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
				throw new KonMissingRefreshTokenError();
			}

			try {
				const decoded = jwt.verify(
					refreshToken,
					REFRESH_TOKEN_SECRET,
				) as TokenPayload;

				// Tokens
				const tokenPayload: TokenPayload = {
					administratorId: decoded.administratorId,
					email: decoded.email,
				};
				const newAccessToken = generateAccessToken(tokenPayload);
				const newRefreshToken = generateRefreshToken(tokenPayload);

				// Cookies
				generateCsrfToken(req, res); // Generates the x-csrf-token cookie
				res.cookie("refreshToken", newRefreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					path: "/",
					maxAge: COOKIE_MAX_AGE,
				});

				// Response
				res.status(200).json({
					accessToken: newAccessToken,
				});
			} catch (err) {
				logger.debug({ err }, "Error during verification of JWT.");
				throw new KonInvalidRefreshTokenError();
			}
		},
	),
);

router.post(
	"/logout",
	catchError(async (_req: Request, res: Response) => {
		const isProduction = process.env.NODE_ENV === "production";
		res.clearCookie("refreshToken", {
			path: "/",
			httpOnly: true,
			secure: isProduction,
			sameSite: "strict",
		});
		res.clearCookie(
			isProduction
				? "__Host-psifi.x-csrf-token"
				: "psifi.x-csrf-token",
			{
				path: "/",
				httpOnly: false,
				secure: isProduction,
				sameSite: "strict",
			},
		);
		res.status(200).json({ message: "Logged out successfully" });
	}),
);

export default router;
