import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@lib/prisma";
import { catchError, prismaErrorHandler } from "./errorHandler";
import { loggerHttp, logger } from "./logger";
import { access_token_secret, authenticateToken } from "./authenticateToken";

const app = express();
const port = process.env.SV_PORT || 3000;

// Middleware
app.use(cors());
app.use(loggerHttp);
app.use(express.json());

// Endpoints
app.post(
	"/administrators/register",
	catchError(async (req: Request, res: Response) => {
		const { firstName, lastName, email, password } = req.body;

		if (!firstName || !lastName || !email || !password) {
			return res.status(400).json({
				error: true,
				message: "Missing required fields.",
			});
		}

		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		const result = await prisma.administrator.create({
			data: {
				FirstName: firstName,
				LastName: lastName,
				Email: email,
				PasswordHash: hashedPassword,
			},
		});

		res.status(201).json({
			administratorId: result.AdministratorID,
		});
	}),
);

app.post(
	"/administrators/login",
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

		const token = jwt.sign(tokenPayload, access_token_secret, {
			expiresIn: "1h",
		});

		res.status(200).json({
			token,
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

app.get(
	"/administrators/me",
	authenticateToken,
	catchError(async (req: Request, res: Response) => {
		const adminId = req.administrator?.administratorId;

		const result = await prisma.administrator.findUnique({
			where: {
				AdministratorID: adminId,
			},
			include: {
				Condominiums: true,
			},
		});

		if (!result) {
			return res.status(404).json({
				error: true,
				message: "Profile not found in database.",
			});
		}

		res.status(200).json({
			administratorId: result.AdministratorID,
			firstName: result.FirstName,
			lastName: result.LastName,
			email: result.Email,
			registrationDate: result.RegistrationDate,
			condominiums: result.Condominiums.map((c) => ({
				condominiumId: c.CondominiumID,
				name: c.Name,
			})),
		});
	}),
);

// Automatic error handling
//! Must be directly below the endpoints
app.use(prismaErrorHandler);

// Run server
app.listen(port, () => {
	logger.info(`Express is running on port ${port}`);
});
