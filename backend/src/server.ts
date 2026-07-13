import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { catchError, prismaErrorHandler } from "./errorHandler";

const app = express();
const port = process.env.SV_PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan("tiny"));
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

		const result = await prisma.administrator.create({
			data: {
				FirstName: firstName,
				LastName: lastName,
				Email: email,
				PasswordHash: password,
			},
		});

		res.status(201).json(result.AdministratorID);
	}),
);

// Automatic error handling
app.use(prismaErrorHandler);

// Run server
app.listen(port, () => {
	console.log(`Express is running on port ${port}`);
});
