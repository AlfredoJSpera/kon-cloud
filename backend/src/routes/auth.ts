import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router } from "express";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandler";
import { logger } from "@middleware/logger";
import { refresh_token_secret } from "@middleware/authenticateToken";
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
} from "@errors/authentication";

const router = Router();

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

			res.status(200).json({
				accessToken,
				refreshToken,
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
	catchError(
		async (
			req: RefreshTokenApiContract["Req"],
			res: RefreshTokenApiContract["Res"],
		) => {
			const { refreshToken } = req.body;

			if (!refreshToken) {
				throw new KonMissingRequiredFieldsError();
			}

			jwt.verify(
				refreshToken,
				refresh_token_secret,
				(err, decoded: any) => {
					if (err) {
						logger.debug(
							{ err },
							"Error during verification of JWT.",
						);
						throw new KonInvalidTokenError();
					}

					const tokenPayload: TokenPayload = {
						administratorId: decoded.administratorId,
						email: decoded.email,
					};

					res.status(200).json({
						accessToken: generateAccessToken(tokenPayload),
						refreshToken: generateRefreshToken(tokenPayload),
					});
				},
			);
		},
	),
);

export default router;
