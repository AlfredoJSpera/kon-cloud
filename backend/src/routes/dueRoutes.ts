import { Router } from "express";
import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	IDueCreateInput,
	IDueOutput,
	IDueUpdateInput,
	ITenantBalanceOutput,
} from "@interfaces/due";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";
import { KonAccessDeniedError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

const router = Router();

// GET /dues/balances?condominiumId=...
type TenantBalancesApiContract = KonApiContract<
	never,
	ITenantBalanceOutput[],
	never,
	{ condominiumId?: string }
>;
router.get(
	"/balances",
	authenticateToken,
	catchError(
		async (
			req: TenantBalancesApiContract["Req"],
			res: TenantBalancesApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;

			if (!condoIdStr) {
				throw new KonMissingRequiredFieldsError(
					"Missing required query parameter: condominiumId.",
				);
			}

			const condoId = parseInt(condoIdStr as string, 10);
			if (isNaN(condoId)) {
				throw new KonIncorrectFieldTypeError(
					"condominiumId must be a valid number.",
				);
			}

			const condo = await prisma.condominium.findUnique({
				where: { CondominiumID: condoId },
			});

			if (!condo) {
				throw new KonNotFoundError("Condominium not found.");
			}

			if (condo.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const tenants = await prisma.tenant.findMany({
				where: { CondominiumID: condoId },
				include: {
					Dues: true,
					Payments: true,
				},
				orderBy: { ApartmentNumber: "asc" },
			});

			const balances: ITenantBalanceOutput[] = tenants.map((t) => {
				const totalDues = t.Dues.reduce(
					(sum, d) => sum + Number(d.Amount),
					0,
				);
				const totalPayments = t.Payments.reduce(
					(sum, p) => sum + Number(p.Amount),
					0,
				);
				const currentBalance = totalDues - totalPayments;

				return {
					tenantId: t.TenantID,
					tenantName: `${t.FirstName} ${t.LastName}`,
					apartmentNumber: t.ApartmentNumber,
					totalDues: Number(totalDues.toFixed(2)),
					totalPayments: Number(totalPayments.toFixed(2)),
					currentBalance: Number(currentBalance.toFixed(2)),
				};
			});

			res.status(200).json(balances);
		},
	),
);

// GET /dues?condominiumId=...&tenantId=...
type ListDuesApiContract = KonApiContract<
	never,
	IDueOutput[],
	never,
	{ condominiumId?: string; tenantId?: string }
>;
router.get(
	"/",
	authenticateToken,
	catchError(
		async (
			req: ListDuesApiContract["Req"],
			res: ListDuesApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;
			const tenantIdStr = req.query.tenantId;

			if (!condoIdStr && !tenantIdStr) {
				throw new KonMissingRequiredFieldsError(
					"Either condominiumId or tenantId query parameter is required.",
				);
			}

			let whereClause: Prisma.DueWhereInput = {};

			if (tenantIdStr) {
				const tenantId = parseInt(tenantIdStr as string, 10);
				if (isNaN(tenantId)) {
					throw new KonIncorrectFieldTypeError("Invalid tenantId.");
				}
				const tenant = await prisma.tenant.findUnique({
					where: { TenantID: tenantId },
					include: { Condominium: true },
				});
				if (!tenant) {
					throw new KonNotFoundError("Tenant not found.");
				}
				if (tenant.Condominium.AdministratorID !== adminId) {
					throw new KonAccessDeniedError();
				}
				whereClause = { TenantID: tenantId };
			} else if (condoIdStr) {
				const condoId = parseInt(condoIdStr as string, 10);
				if (isNaN(condoId)) {
					throw new KonIncorrectFieldTypeError("Invalid condominiumId.");
				}
				const condo = await prisma.condominium.findUnique({
					where: { CondominiumID: condoId },
				});
				if (!condo) {
					throw new KonNotFoundError("Condominium not found.");
				}
				if (condo.AdministratorID !== adminId) {
					throw new KonAccessDeniedError();
				}
				whereClause = { Tenant: { CondominiumID: condoId } };
			}

			const dues = await prisma.due.findMany({
				where: whereClause,
				include: { Tenant: true },
				orderBy: { CreatedAt: "desc" },
			});

			const result: IDueOutput[] = dues.map((d) => ({
				dueId: d.DueID,
				tenantId: d.TenantID,
				tenantName: d.Tenant
					? `${d.Tenant.FirstName} ${d.Tenant.LastName}`
					: undefined,
				apartmentNumber: d.Tenant ? d.Tenant.ApartmentNumber : undefined,
				amount: Number(d.Amount.toFixed(2)),
				reason: d.Reason,
				createdAt: d.CreatedAt.toISOString(),
			}));

			res.status(200).json(result);
		},
	),
);

// POST /dues
type CreateDueApiContract = KonApiContract<IDueCreateInput, IDueOutput>;
router.post(
	"/",
	authenticateToken,
	catchError(
		async (
			req: CreateDueApiContract["Req"],
			res: CreateDueApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const { tenantId, amount, reason } = req.body;

			if (tenantId === undefined || amount === undefined || !reason) {
				throw new KonMissingRequiredFieldsError(
					"tenantId, amount, and reason are required.",
				);
			}

			if (
				typeof tenantId !== "number" ||
				typeof amount !== "number" ||
				typeof reason !== "string" ||
				isNaN(amount) ||
				amount <= 0
			) {
				throw new KonIncorrectFieldTypeError(
					"Invalid types or invalid amount (amount must be positive).",
				);
			}

			const trimmedReason = reason.trim();
			if (!trimmedReason) {
				throw new KonMissingRequiredFieldsError(
					"Reason cannot be empty.",
				);
			}

			const tenant = await prisma.tenant.findUnique({
				where: { TenantID: tenantId },
				include: { Condominium: true },
			});

			if (!tenant) {
				throw new KonNotFoundError("Tenant not found.");
			}

			if (tenant.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			// Ensure fixed precision 2 decimal places
			const fixedAmount = new Prisma.Decimal(amount.toFixed(2));

			const created = await prisma.due.create({
				data: {
					TenantID: tenantId,
					Amount: fixedAmount,
					Reason: trimmedReason,
				},
				include: { Tenant: true },
			});

			res.status(201).json({
				dueId: created.DueID,
				tenantId: created.TenantID,
				tenantName: `${created.Tenant.FirstName} ${created.Tenant.LastName}`,
				apartmentNumber: created.Tenant.ApartmentNumber,
				amount: Number(created.Amount.toFixed(2)),
				reason: created.Reason,
				createdAt: created.CreatedAt.toISOString(),
			});
		},
	),
);

// DELETE /dues/:id
type DeleteDueApiContract = KonApiContract<
	never,
	{ message: string },
	{ id: string }
>;
router.delete(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: DeleteDueApiContract["Req"],
			res: DeleteDueApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const dueId = parseInt(req.params.id, 10);

			if (isNaN(dueId)) {
				throw new KonNotFoundError();
			}

			const due = await prisma.due.findUnique({
				where: { DueID: dueId },
				include: { Tenant: { include: { Condominium: true } } },
			});

			if (!due) {
				throw new KonNotFoundError("Due amount not found.");
			}

			if (due.Tenant.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			await prisma.due.delete({
				where: { DueID: dueId },
			});

			res.status(200).json({ message: "Due deleted successfully." });
		},
	),
);

// PUT /dues/:id
type UpdateDueApiContract = KonApiContract<
	IDueUpdateInput,
	IDueOutput,
	{ id: string }
>;
router.put(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: UpdateDueApiContract["Req"],
			res: UpdateDueApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const dueId = parseInt(req.params.id, 10);

			if (isNaN(dueId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.due.findUnique({
				where: { DueID: dueId },
				include: { Tenant: { include: { Condominium: true } } },
			});

			if (!existing) {
				throw new KonNotFoundError("Due amount not found.");
			}

			if (existing.Tenant.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const { amount, reason } = req.body;

			if (
				(amount !== undefined &&
					(typeof amount !== "number" || isNaN(amount) || amount <= 0)) ||
				(reason !== undefined && typeof reason !== "string")
			) {
				throw new KonIncorrectFieldTypeError("Invalid field types.");
			}

			const newAmount =
				amount !== undefined
					? new Prisma.Decimal(amount.toFixed(2))
					: existing.Amount;

			const newReason =
				reason !== undefined ? reason.trim() : existing.Reason;

			if (!newReason) {
				throw new KonMissingRequiredFieldsError(
					"Reason cannot be empty.",
				);
			}

			const updated = await prisma.due.update({
				where: { DueID: dueId },
				data: {
					Amount: newAmount,
					Reason: newReason,
				},
				include: { Tenant: true },
			});

			res.status(200).json({
				dueId: updated.DueID,
				tenantId: updated.TenantID,
				tenantName: `${updated.Tenant.FirstName} ${updated.Tenant.LastName}`,
				apartmentNumber: updated.Tenant.ApartmentNumber,
				amount: Number(updated.Amount.toFixed(2)),
				reason: updated.Reason,
				createdAt: updated.CreatedAt.toISOString(),
			});
		},
	),
);

export default router;
