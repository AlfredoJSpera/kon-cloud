import bcrypt from "bcrypt";
import { Router, Request, Response } from "express";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandler";
import { authenticateToken } from "@middleware/authenticateToken";
import {
	IAdministratorMeOutput,
	IAdministratorRegisterInput,
	IAdministratorRegisterOutput,
} from "@interfaces/administrator";
import { IErrorResponse } from "@interfaces/common";

const router = Router();

type RegisterResponse = IAdministratorRegisterOutput | IErrorResponse;
router.post(
	"/register",
	catchError(
		async (
			req: Request<
				Record<string, never>,
				RegisterResponse,
				IAdministratorRegisterInput
			>,
			res: Response<RegisterResponse>,
		) => {
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

			const responseData: IAdministratorRegisterOutput = {
				administratorId: result.AdministratorID,
			};
			res.status(201).json(responseData);
		},
	),
);

type MeResponse = IAdministratorMeOutput | IErrorResponse;
router.get(
	"/me",
	authenticateToken,
	catchError(
		async (
			req: Request<Record<string, never>, MeResponse>,
			res: Response<MeResponse>,
		) => {
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

			const responseData: IAdministratorMeOutput = {
				administratorId: result.AdministratorID,
				firstName: result.FirstName,
				lastName: result.LastName,
				email: result.Email,
				condominiums: result.Condominiums.map((c) => ({
					condominiumId: c.CondominiumID,
					name: c.Name,
				})),
			};
			res.status(200).json(responseData);
		},
	),
);

export default router;
