import { Router } from "express";
import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import { IPaymentCreateInput, IPaymentOutput } from "@interfaces/due";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";
import { KonAccessDeniedError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

const router = Router();

// GET /payments?condominiumId=...&tenantId=...
type ListPaymentsApiContract = KonApiContract<
	never,
	IPaymentOutput[],
	never,
	{ condominiumId?: string; tenantId?: string }
>;
router.get(
	"/",
	authenticateToken,
	catchError(
		async (
			req: ListPaymentsApiContract["Req"],
			res: ListPaymentsApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;
			const tenantIdStr = req.query.tenantId;

			if (!condoIdStr && !tenantIdStr) {
				throw new KonMissingRequiredFieldsError(
					"Either condominiumId or tenantId query parameter is required.",
				);
			}

			let whereClause: Prisma.PaymentWhereInput = {};

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

			const payments = await prisma.payment.findMany({
				where: whereClause,
				include: { Tenant: true },
				orderBy: { PaymentDate: "desc" },
			});

			const result: IPaymentOutput[] = payments.map((p) => ({
				paymentId: p.PaymentID,
				tenantId: p.TenantID,
				dueId: p.DueID ?? undefined,
				tenantName: p.Tenant
					? `${p.Tenant.FirstName} ${p.Tenant.LastName}`
					: undefined,
				amount: Number(p.Amount.toFixed(2)),
				paymentDate: p.PaymentDate.toISOString(),
				notes: p.Notes ?? undefined,
			}));

			res.status(200).json(result);
		},
	),
);

// POST /payments
type CreatePaymentApiContract = KonApiContract<
	IPaymentCreateInput,
	IPaymentOutput
>;
router.post(
	"/",
	authenticateToken,
	catchError(
		async (
			req: CreatePaymentApiContract["Req"],
			res: CreatePaymentApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const { tenantId, dueId, amount, paymentDate, notes } = req.body;

			if (
				tenantId === undefined ||
				amount === undefined ||
				!paymentDate
			) {
				throw new KonMissingRequiredFieldsError(
					"tenantId, amount, and paymentDate are required.",
				);
			}

			if (
				typeof tenantId !== "number" ||
				typeof amount !== "number" ||
				typeof paymentDate !== "string" ||
				isNaN(amount) ||
				amount <= 0 ||
				(dueId !== undefined && typeof dueId !== "number") ||
				(notes !== undefined && typeof notes !== "string")
			) {
				throw new KonIncorrectFieldTypeError(
					"Invalid parameter types or amount must be positive.",
				);
			}

			const parsedDate = new Date(paymentDate);
			if (isNaN(parsedDate.getTime())) {
				throw new KonIncorrectFieldTypeError(
					"Invalid paymentDate format.",
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

			const fixedAmount = new Prisma.Decimal(amount.toFixed(2));
			const trimmedNotes = notes ? notes.trim() : undefined;

			const created = await prisma.payment.create({
				data: {
					TenantID: tenantId,
					DueID: dueId ?? null,
					Amount: fixedAmount,
					PaymentDate: parsedDate,
					Notes: trimmedNotes ?? null,
				},
				include: { Tenant: true },
			});

			res.status(201).json({
				paymentId: created.PaymentID,
				tenantId: created.TenantID,
				dueId: created.DueID ?? undefined,
				tenantName: `${created.Tenant.FirstName} ${created.Tenant.LastName}`,
				amount: Number(created.Amount.toFixed(2)),
				paymentDate: created.PaymentDate.toISOString(),
				notes: created.Notes ?? undefined,
			});
		},
	),
);

// DELETE /payments/:id
type DeletePaymentApiContract = KonApiContract<
	never,
	{ message: string },
	{ id: string }
>;
router.delete(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: DeletePaymentApiContract["Req"],
			res: DeletePaymentApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const paymentId = parseInt(req.params.id, 10);

			if (isNaN(paymentId)) {
				throw new KonNotFoundError();
			}

			const payment = await prisma.payment.findUnique({
				where: { PaymentID: paymentId },
				include: { Tenant: { include: { Condominium: true } } },
			});

			if (!payment) {
				throw new KonNotFoundError("Payment record not found.");
			}

			if (payment.Tenant.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			await prisma.payment.delete({
				where: { PaymentID: paymentId },
			});

			res.status(200).json({ message: "Payment deleted successfully." });
		},
	),
);

export default router;
