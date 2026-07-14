import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
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
import { KonApiContract } from "@interfaces/common";

let refreshTokens: string[] = [];
const router = Router();

type LoginApiContract = KonApiContract<IAuthLoginInput, IAuthLoginOutput>;
router.post(
	"/login",
	catchError(
		async (req: LoginApiContract["Req"], res: LoginApiContract["Res"]) => {
			const { email, password } = req.body;

			if (!email || !password) {
				return res.status(400).json({
					error: true,
					message: "Missing required fields.",
				});
			}

			const result = await prisma.administrator.findFirst({
				where: {
					Email: email,
				},
				include: { Condominiums: true },
			});

			if (!result) {
				return res.status(401).json({
					error: true,
					message: "Invalid credentials.",
				});
			}

			if (!result.PasswordHash) {
				return res.status(401).json({
					error: true,
					message: "Invalid credentials.",
				});
			}

			const isPasswordValid = await bcrypt.compare(
				password,
				result.PasswordHash,
			);

			if (!isPasswordValid) {
				return res.status(401).json({
					error: true,
					message: "Invalid credentials.",
				});
			}

			const tokenPayload = {
				administratorId: result.AdministratorID,
				email: result.Email,
			};

			const accessToken = generateAccessToken(tokenPayload);
			const refreshToken = generateRefreshToken(tokenPayload);
			refreshTokens.push(refreshToken);

			const responseData: IAuthLoginOutput = {
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
			};
			res.status(200).json(responseData);
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
				return res.status(401).json({
					error: true,
					message: "Missing token.",
				});
			}

			if (!refreshTokens.includes(refreshToken)) {
				return res.status(401).json({
					error: true,
					message: "Invalid or expired token.",
				});
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
						return res.status(401).json({
							error: true,
							message: "Invalid or expired token.",
						});
					}

					const tokenPayload = {
						administratorId: decoded.administratorId,
						email: decoded.email,
					};

					const responseData: IAuthRefreshTokenOutput = {
						accessToken: generateAccessToken(tokenPayload),
					};
					res.status(200).json(responseData);
				},
			);
		},
	),
);

export default router;
