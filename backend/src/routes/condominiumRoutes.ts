import { Router } from "express";
import { prisma } from "@lib/prisma";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@interfaces/condominium";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";
import { KonAccessDeniedError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

const router = Router();

type ListCondominiumsApiContract = KonApiContract<
	never,
	ICondominiumOutput[]
>;
router.get(
	"/",
	authenticateToken,
	catchError(
		async (
			req: ListCondominiumsApiContract["Req"],
			res: ListCondominiumsApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;

			const condominiums = await prisma.condominium.findMany({
				where: {
					AdministratorID: adminId,
				},
			});

			const result: ICondominiumOutput[] = condominiums.map((c) => ({
				condominiumId: c.CondominiumID,
				administratorId: c.AdministratorID,
				name: c.Name,
				...(c.Address ? { address: c.Address } : {}),
			}));

			res.status(200).json(result);
		},
	),
);

type CreateCondominiumApiContract = KonApiContract<
	ICondominiumCreateInput,
	ICondominiumOutput
>;
router.post(
	"/",
	authenticateToken,
	catchError(
		async (
			req: CreateCondominiumApiContract["Req"],
			res: CreateCondominiumApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const { name, address } = req.body;

			if (!name) {
				throw new KonMissingRequiredFieldsError();
			}

			if (
				typeof name !== "string" ||
				(address !== undefined && typeof address !== "string")
			) {
				throw new KonIncorrectFieldTypeError();
			}

			const created = await prisma.condominium.create({
				data: {
					AdministratorID: adminId!,
					Name: name,
					Address: address || null,
				},
			});

			res.status(201).json({
				condominiumId: created.CondominiumID,
				administratorId: created.AdministratorID,
				name: created.Name,
				...(created.Address ? { address: created.Address } : {}),
			});
		},
	),
);

type GetCondominiumApiContract = KonApiContract<
	never,
	ICondominiumOutput,
	{ id: string }
>;
router.get(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: GetCondominiumApiContract["Req"],
			res: GetCondominiumApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condominiumId = parseInt(req.params.id, 10);

			if (isNaN(condominiumId)) {
				throw new KonNotFoundError();
			}

			const condominium = await prisma.condominium.findUnique({
				where: {
					CondominiumID: condominiumId,
				},
			});

			if (!condominium) {
				throw new KonNotFoundError();
			}

			if (condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			res.status(200).json({
				condominiumId: condominium.CondominiumID,
				administratorId: condominium.AdministratorID,
				name: condominium.Name,
				...(condominium.Address ? { address: condominium.Address } : {}),
			});
		},
	),
);

type UpdateCondominiumApiContract = KonApiContract<
	ICondominiumUpdateInput,
	ICondominiumOutput,
	{ id: string }
>;
router.put(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: UpdateCondominiumApiContract["Req"],
			res: UpdateCondominiumApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condominiumId = parseInt(req.params.id, 10);

			if (isNaN(condominiumId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.condominium.findUnique({
				where: {
					CondominiumID: condominiumId,
				},
			});

			if (!existing) {
				throw new KonNotFoundError();
			}

			if (existing.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const { name, address } = req.body;

			if (
				(name !== undefined && typeof name !== "string") ||
				(address !== undefined && typeof address !== "string")
			) {
				throw new KonIncorrectFieldTypeError();
			}

			const updated = await prisma.condominium.update({
				where: {
					CondominiumID: condominiumId,
				},
				data: {
					...(name !== undefined ? { Name: name } : {}),
					...(address !== undefined ? { Address: address } : {}),
				},
			});

			res.status(200).json({
				condominiumId: updated.CondominiumID,
				administratorId: updated.AdministratorID,
				name: updated.Name,
				...(updated.Address ? { address: updated.Address } : {}),
			});
		},
	),
);

type DeleteCondominiumApiContract = KonApiContract<
	never,
	{ message: string },
	{ id: string }
>;
router.delete(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: DeleteCondominiumApiContract["Req"],
			res: DeleteCondominiumApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condominiumId = parseInt(req.params.id, 10);

			if (isNaN(condominiumId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.condominium.findUnique({
				where: {
					CondominiumID: condominiumId,
				},
			});

			if (!existing) {
				throw new KonNotFoundError();
			}

			if (existing.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			await prisma.condominium.delete({
				where: {
					CondominiumID: condominiumId,
				},
			});

			res.status(200).json({ message: "Condominium deleted successfully" });
		},
	),
);

export default router;
