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

let refreshTokens = [];
const router = Router();

router.post(
	"/login",
	catchError(async (req: Request, res: Response) => {
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

		res.status(200).json({
			accessToken,
			refreshToken,
			profile: {
				administratorId: result.AdministratorID,
				firstName: result.FirstName,
				lastName: result.LastName,
				email: result.Email,
				registrationDate: result.RegistrationDate,
				condominiums: result.Condominiums.map((c) => ({
					condominiumId: c.CondominiumID,
					name: c.Name,
				})),
			},
		});
	}),
);

router.post(
	"/refresh-token",
	catchError(async (req: Request, res: Response) => {
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

		jwt.verify(refreshToken, refresh_token_secret, (err, decoded: any) => {
			if (err) {
				logger.debug({ err }, "Error during verification of JWT.");
				return res.status(401).json({
					error: true,
					message: "Invalid or expired token.",
				});
			}

			const tokenPayload = {
				administratorId: decoded.administratorId,
				email: decoded.email,
			};

			const accessToken = generateAccessToken(tokenPayload);

			res.status(200).json({ accessToken });
		});
	}),
);

export default router;
