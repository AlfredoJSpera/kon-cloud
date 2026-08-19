import { Router } from "express";
import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import {
	ExpenseCategory,
	ICashBalanceOutput,
	IExpenseCreateInput,
	IExpenseOutput,
	IExpenseUpdateInput,
} from "@interfaces/expense";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validationErrors";
import { KonAccessDeniedError } from "@errors/authenticationErrors";
import { KonApiContract } from "@utils/apiContract";

const ALLOWED_CATEGORIES: ExpenseCategory[] = [
	"Utilities",
	"Cleaning",
	"Maintenance",
	"Insurance",
	"Other",
];

const router = Router();

// GET /expenses/cash-balance?condominiumId=...
type CashBalanceApiContract = KonApiContract<
	never,
	ICashBalanceOutput,
	never,
	{ condominiumId?: string }
>;
router.get(
	"/cash-balance",
	authenticateToken,
	catchError(
		async (
			req: CashBalanceApiContract["Req"],
			res: CashBalanceApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;

			if (!condoIdStr) {
				throw new KonMissingRequiredFieldsError(
					"condominiumId query parameter is required.",
				);
			}

			const condoId = parseInt(condoIdStr, 10);
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

			// Aggregate total payments received for tenants in this condominium
			const paymentsAggregate = await prisma.payment.aggregate({
				where: {
					Tenant: { CondominiumID: condoId },
				},
				_sum: {
					Amount: true,
				},
			});

			// Aggregate total paid expenses for this condominium
			const expensesAggregate = await prisma.expense.aggregate({
				where: {
					CondominiumID: condoId,
				},
				_sum: {
					Amount: true,
				},
			});

			const totalPayments = Number(
				paymentsAggregate._sum.Amount?.toFixed(2) ?? 0,
			);
			const totalExpenses = Number(
				expensesAggregate._sum.Amount?.toFixed(2) ?? 0,
			);
			const cashBalance = Number((totalPayments - totalExpenses).toFixed(2));

			res.status(200).json({
				condominiumId: condoId,
				totalPayments,
				totalExpenses,
				cashBalance,
			});
		},
	),
);

// GET /expenses?condominiumId=...
type ListExpensesApiContract = KonApiContract<
	never,
	IExpenseOutput[],
	never,
	{ condominiumId?: string }
>;
router.get(
	"/",
	authenticateToken,
	catchError(
		async (
			req: ListExpensesApiContract["Req"],
			res: ListExpensesApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const condoIdStr = req.query.condominiumId;

			if (!condoIdStr) {
				throw new KonMissingRequiredFieldsError(
					"condominiumId query parameter is required.",
				);
			}

			const condoId = parseInt(condoIdStr, 10);
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

			const expenses = await prisma.expense.findMany({
				where: { CondominiumID: condoId },
				orderBy: { ExpenseDate: "desc" },
			});

			const result: IExpenseOutput[] = expenses.map((e) => ({
				expenseId: e.ExpenseID,
				condominiumId: e.CondominiumID,
				category: e.Category as ExpenseCategory,
				amount: Number(e.Amount.toFixed(2)),
				expenseDate: e.ExpenseDate.toISOString(),
				description: e.Description ?? undefined,
				createdAt: e.CreatedAt.toISOString(),
			}));

			res.status(200).json(result);
		},
	),
);

// POST /expenses
type CreateExpenseApiContract = KonApiContract<
	IExpenseCreateInput,
	IExpenseOutput
>;
router.post(
	"/",
	authenticateToken,
	catchError(
		async (
			req: CreateExpenseApiContract["Req"],
			res: CreateExpenseApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const { condominiumId, category, amount, expenseDate, description } =
				req.body;

			if (
				condominiumId === undefined ||
				!category ||
				amount === undefined ||
				!expenseDate
			) {
				throw new KonMissingRequiredFieldsError(
					"condominiumId, category, amount, and expenseDate are required.",
				);
			}

			if (
				typeof condominiumId !== "number" ||
				typeof category !== "string" ||
				typeof amount !== "number" ||
				typeof expenseDate !== "string" ||
				isNaN(amount) ||
				amount <= 0 ||
				(description !== undefined && typeof description !== "string")
			) {
				throw new KonIncorrectFieldTypeError(
					"Invalid parameter types or amount must be positive.",
				);
			}

			if (!ALLOWED_CATEGORIES.includes(category as ExpenseCategory)) {
				throw new KonIncorrectFieldTypeError(
					`Invalid expense category. Allowed categories: ${ALLOWED_CATEGORIES.join(", ")}`,
				);
			}

			const parsedDate = new Date(expenseDate);
			if (isNaN(parsedDate.getTime())) {
				throw new KonIncorrectFieldTypeError(
					"Invalid expenseDate format.",
				);
			}

			const condo = await prisma.condominium.findUnique({
				where: { CondominiumID: condominiumId },
			});

			if (!condo) {
				throw new KonNotFoundError("Condominium not found.");
			}

			if (condo.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const fixedAmount = new Prisma.Decimal(amount.toFixed(2));
			const trimmedDesc = description ? description.trim() : undefined;

			const created = await prisma.expense.create({
				data: {
					CondominiumID: condominiumId,
					Category: category,
					Amount: fixedAmount,
					ExpenseDate: parsedDate,
					Description: trimmedDesc ?? null,
				},
			});

			res.status(201).json({
				expenseId: created.ExpenseID,
				condominiumId: created.CondominiumID,
				category: created.Category as ExpenseCategory,
				amount: Number(created.Amount.toFixed(2)),
				expenseDate: created.ExpenseDate.toISOString(),
				description: created.Description ?? undefined,
				createdAt: created.CreatedAt.toISOString(),
			});
		},
	),
);

// PUT /expenses/:id
type UpdateExpenseApiContract = KonApiContract<
	IExpenseUpdateInput,
	IExpenseOutput,
	{ id: string }
>;
router.put(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: UpdateExpenseApiContract["Req"],
			res: UpdateExpenseApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const expenseId = parseInt(req.params.id, 10);

			if (isNaN(expenseId)) {
				throw new KonNotFoundError();
			}

			const existing = await prisma.expense.findUnique({
				where: { ExpenseID: expenseId },
				include: { Condominium: true },
			});

			if (!existing) {
				throw new KonNotFoundError("Expense record not found.");
			}

			if (existing.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			const { category, amount, expenseDate, description } = req.body;

			if (
				(category !== undefined &&
					(!ALLOWED_CATEGORIES.includes(category as ExpenseCategory) ||
						typeof category !== "string")) ||
				(amount !== undefined &&
					(typeof amount !== "number" || isNaN(amount) || amount <= 0)) ||
				(expenseDate !== undefined && typeof expenseDate !== "string") ||
				(description !== undefined && typeof description !== "string")
			) {
				throw new KonIncorrectFieldTypeError("Invalid field types.");
			}

			let newExpenseDate = existing.ExpenseDate;
			if (expenseDate !== undefined) {
				const parsedDate = new Date(expenseDate);
				if (isNaN(parsedDate.getTime())) {
					throw new KonIncorrectFieldTypeError(
						"Invalid expenseDate format.",
					);
				}
				newExpenseDate = parsedDate;
			}

			const newCategory = category ?? existing.Category;
			const newAmount =
				amount !== undefined
					? new Prisma.Decimal(amount.toFixed(2))
					: existing.Amount;

			const newDesc =
				description !== undefined
					? description.trim().length > 0
						? description.trim()
						: null
					: existing.Description;

			const updated = await prisma.expense.update({
				where: { ExpenseID: expenseId },
				data: {
					Category: newCategory,
					Amount: newAmount,
					ExpenseDate: newExpenseDate,
					Description: newDesc,
				},
			});

			res.status(200).json({
				expenseId: updated.ExpenseID,
				condominiumId: updated.CondominiumID,
				category: updated.Category as ExpenseCategory,
				amount: Number(updated.Amount.toFixed(2)),
				expenseDate: updated.ExpenseDate.toISOString(),
				description: updated.Description ?? undefined,
				createdAt: updated.CreatedAt.toISOString(),
			});
		},
	),
);

// DELETE /expenses/:id
type DeleteExpenseApiContract = KonApiContract<
	never,
	{ message: string },
	{ id: string }
>;
router.delete(
	"/:id",
	authenticateToken,
	catchError(
		async (
			req: DeleteExpenseApiContract["Req"],
			res: DeleteExpenseApiContract["Res"],
		) => {
			const adminId = req.administrator?.administratorId;
			const expenseId = parseInt(req.params.id, 10);

			if (isNaN(expenseId)) {
				throw new KonNotFoundError();
			}

			const expense = await prisma.expense.findUnique({
				where: { ExpenseID: expenseId },
				include: { Condominium: true },
			});

			if (!expense) {
				throw new KonNotFoundError("Expense record not found.");
			}

			if (expense.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			await prisma.expense.delete({
				where: { ExpenseID: expenseId },
			});

			res.status(200).json({ message: "Expense deleted successfully." });
		},
	),
);

export default router;
