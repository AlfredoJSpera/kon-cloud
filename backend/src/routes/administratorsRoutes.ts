import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandler";
import { authenticateToken } from "@middleware/authenticateToken";

const router = Router();

router.post(
	"/register",
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

router.get(
	"/me",
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

export default router;
