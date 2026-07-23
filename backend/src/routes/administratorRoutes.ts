import bcrypt from "bcrypt";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	IAdministratorMeOutput,
	IAdministratorRegisterInput,
	IAdministratorRegisterOutput,
} from "@interfaces/administrator";
import { KonApiContract } from "@interfaces/common";
import {
	KonEmailAlreadyExistsError,
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";

const router = Router();

type RegisterApiContract = KonApiContract<
	IAdministratorRegisterInput,
	IAdministratorRegisterOutput
>;
router.post(
	"/register",
	catchError(
		async (
			req: RegisterApiContract["Req"],
			res: RegisterApiContract["Res"],
		) => {
			const { firstName, lastName, email, password } = req.body;

			if (!firstName || !lastName || !email || !password) {
				throw new KonMissingRequiredFieldsError();
			}

			if (
				typeof firstName !== "string" ||
				typeof lastName !== "string" ||
				typeof email !== "string" ||
				typeof password !== "string"
			) {
				throw new KonIncorrectFieldTypeError();
			}

			const found = await prisma.administrator.findUnique({
				where: {
					Email: email,
				},
			});

			if (found) {
				throw new KonEmailAlreadyExistsError();
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
		},
	),
);

type MeApiContract = KonApiContract<never, IAdministratorMeOutput>;
router.get(
	"/me",
	authenticateToken,
	catchError(async (req: MeApiContract["Req"], res: MeApiContract["Res"]) => {
		//* Error checking for adminId is done in authenticateToken
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
			throw new KonNotFoundError();
		}

		res.status(200).json({
			administratorId: result.AdministratorID,
			firstName: result.FirstName,
			lastName: result.LastName,
			email: result.Email,
			condominiums: result.Condominiums.map((c) => ({
				condominiumId: c.CondominiumID,
				name: c.Name,
			})),
		});
	}),
);

export default router;
