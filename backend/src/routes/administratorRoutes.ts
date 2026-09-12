import bcrypt from "bcrypt";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	IAdministratorMeOutput,
	IAdministratorRegisterInput,
	IAdministratorRegisterOutput,
	IAdministratorUpdateInput,
	IAdministratorUpdateOutput,
} from "@interfaces/administrator";
import {
	KonEmailAlreadyExistsError,
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";
import { KonInvalidCredentialsError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

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

type UpdateMeApiContract = KonApiContract<
	IAdministratorUpdateInput,
	IAdministratorUpdateOutput
>;
router.put(
	"/me",
	authenticateToken,
	catchError(
		async (
			req: UpdateMeApiContract["Req"],
			res: UpdateMeApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;

			const admin = await prisma.administrator.findUnique({
				where: {
					AdministratorID: adminId,
				},
			});

			if (!admin) {
				throw new KonNotFoundError();
			}

			const { firstName, lastName, email, currentPassword, newPassword } =
				req.body;

			if (
				(firstName !== undefined && typeof firstName !== "string") ||
				(lastName !== undefined && typeof lastName !== "string") ||
				(email !== undefined && typeof email !== "string") ||
				(currentPassword !== undefined &&
					typeof currentPassword !== "string") ||
				(newPassword !== undefined && typeof newPassword !== "string")
			) {
				throw new KonIncorrectFieldTypeError();
			}

			const updateData: {
				FirstName?: string;
				LastName?: string;
				Email?: string;
				PasswordHash?: string;
			} = {};

			if (firstName !== undefined) {
				const trimmedName = firstName.trim();
				if (!trimmedName) {
					throw new KonMissingRequiredFieldsError(
						"First name cannot be empty.",
					);
				}
				updateData.FirstName = trimmedName;
			}

			if (lastName !== undefined) {
				const trimmedLastName = lastName.trim();
				if (!trimmedLastName) {
					throw new KonMissingRequiredFieldsError(
						"Last name cannot be empty.",
					);
				}
				updateData.LastName = trimmedLastName;
			}

			if (email !== undefined && email.trim() !== admin.Email) {
				const trimmedEmail = email.trim();
				if (!trimmedEmail) {
					throw new KonMissingRequiredFieldsError(
						"Email cannot be empty.",
					);
				}
				const existing = await prisma.administrator.findUnique({
					where: {
						Email: trimmedEmail,
					},
				});
				if (existing && existing.AdministratorID !== adminId) {
					throw new KonEmailAlreadyExistsError();
				}
				updateData.Email = trimmedEmail;
			}

			if (newPassword !== undefined && newPassword.trim() !== "") {
				if (!currentPassword) {
					throw new KonMissingRequiredFieldsError(
						"Current password is required to set a new password.",
					);
				}
				const isMatch = await bcrypt.compare(
					currentPassword,
					admin.PasswordHash,
				);
				if (!isMatch) {
					throw new KonInvalidCredentialsError(
						"Invalid current password.",
					);
				}
				const saltRounds = 10;
				updateData.PasswordHash = await bcrypt.hash(
					newPassword,
					saltRounds,
				);
			}

			const updated = await prisma.administrator.update({
				where: {
					AdministratorID: adminId,
				},
				data: updateData,
				include: {
					Condominiums: true,
				},
			});

			res.status(200).json({
				administratorId: updated.AdministratorID,
				firstName: updated.FirstName,
				lastName: updated.LastName,
				email: updated.Email,
				condominiums: updated.Condominiums.map((c) => ({
					condominiumId: c.CondominiumID,
					name: c.Name,
				})),
			});
		},
	),
);

export default router;
