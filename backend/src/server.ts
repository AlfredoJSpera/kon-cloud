import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";
import { catchError, prismaErrorHandler } from "./errorHandler";
import { loggerHttp, logger } from "./logger";

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

		res.status(201).json(result.AdministratorID);
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
		});

		if (!result) {
			return res.status(404).json({
				error: true,
				message: "Account not found.",
			});
		}

		if (!result.PasswordHash) {
			logger.error(
				{ result },
				"Account found during login, but it does not have a password.",
			);
			return res.status(404).json({
				error: true,
				message: "Account credentials not found.",
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

		res.status(200).json(result);
	}),
);

// Automatic error handling
//! Must be directly below the endpoints
app.use(prismaErrorHandler);

// Run server
app.listen(port, () => {
	logger.info(`Express is running on port ${port}`);
});
