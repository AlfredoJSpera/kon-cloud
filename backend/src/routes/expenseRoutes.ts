import { Router } from "express";
import { Readable } from "stream";
import multer from "multer";
import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma/client";
import { catchError } from "@middleware/errorHandlerMW";
import { authenticateToken } from "@middleware/authenticateTokenMW";
import { storageService } from "@lib/storageService";
import {
	ExpenseCategory,
	ICashBalanceOutput,
	IExpenseCreateInput,
	IExpenseOutput,
	IExpenseUpdateInput,
	IExpenseAttachmentOutput,
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

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 15 * 1024 * 1024,
	},
});

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

			const paymentsAggregate = await prisma.payment.aggregate({
				where: {
					Tenant: { CondominiumID: condoId },
				},
				_sum: {
					Amount: true,
				},
			});

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
				include: { Attachments: true },
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
				attachments: e.Attachments?.map((att) => ({
					attachmentId: att.AttachmentID,
					expenseId: att.ExpenseID,
					fileName: att.FileName,
					fileSize: att.FileSize,
					mimeType: att.MimeType,
					uploadedAt: att.UploadedAt.toISOString(),
				})) ?? [],
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
				include: { Attachments: true },
			});

			res.status(201).json({
				expenseId: created.ExpenseID,
				condominiumId: created.CondominiumID,
				category: created.Category as ExpenseCategory,
				amount: Number(created.Amount.toFixed(2)),
				expenseDate: created.ExpenseDate.toISOString(),
				description: created.Description ?? undefined,
				createdAt: created.CreatedAt.toISOString(),
				attachments: created.Attachments?.map((att) => ({
					attachmentId: att.AttachmentID,
					expenseId: att.ExpenseID,
					fileName: att.FileName,
					fileSize: att.FileSize,
					mimeType: att.MimeType,
					uploadedAt: att.UploadedAt.toISOString(),
				})) ?? [],
			});
		},
	),
);

// POST /expenses/:id/attachments
router.post(
	"/:id/attachments",
	authenticateToken,
	upload.array("files"),
	catchError(async (req, res) => {
		const adminId = req.administrator?.administratorId;
		const expenseId = parseInt(req.params.id, 10);

		if (isNaN(expenseId)) {
			throw new KonNotFoundError("Expense not found.");
		}

		const existing = await prisma.expense.findUnique({
			where: { ExpenseID: expenseId },
			include: { Condominium: true },
		});

		if (!existing) {
			throw new KonNotFoundError("Expense not found.");
		}

		if (existing.Condominium.AdministratorID !== adminId) {
			throw new KonAccessDeniedError();
		}

		const files = req.files as Express.Multer.File[] | undefined;
		if (!files || files.length === 0) {
			throw new KonMissingRequiredFieldsError("No files uploaded.");
		}

		const existingCount = await prisma.expenseAttachment.count({
			where: { ExpenseID: expenseId },
		});

		if (existingCount + files.length > 5) {
			throw new KonIncorrectFieldTypeError(
				"Maximum of 5 file attachments per expense allowed.",
			);
		}

		const createdAttachments: IExpenseAttachmentOutput[] = [];

		for (const file of files) {
			const sanitizeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
			const blobName = `expenses/${expenseId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizeFileName}`;

			await storageService.uploadAttachment(
				blobName,
				file.buffer,
				file.mimetype || "application/octet-stream",
			);

			const attachmentRecord = await prisma.expenseAttachment.create({
				data: {
					ExpenseID: expenseId,
					FileName: file.originalname,
					BlobName: blobName,
					FileSize: file.size,
					MimeType: file.mimetype || "application/octet-stream",
				},
			});

			createdAttachments.push({
				attachmentId: attachmentRecord.AttachmentID,
				expenseId: attachmentRecord.ExpenseID,
				fileName: attachmentRecord.FileName,
				fileSize: attachmentRecord.FileSize,
				mimeType: attachmentRecord.MimeType,
				uploadedAt: attachmentRecord.UploadedAt.toISOString(),
			});
		}

		res.status(201).json(createdAttachments);
	}),
);

// GET /expenses/:id/attachments/:attachmentId/download
router.get(
	"/:id/attachments/:attachmentId/download",
	authenticateToken,
	catchError(async (req, res) => {
		const adminId = req.administrator?.administratorId;
		const expenseId = parseInt(req.params.id, 10);
		const attachmentId = req.params.attachmentId;

		if (isNaN(expenseId) || !attachmentId) {
			throw new KonNotFoundError("Attachment not found.");
		}

		const attachment = await prisma.expenseAttachment.findUnique({
			where: { AttachmentID: attachmentId },
			include: {
				Expense: {
					include: { Condominium: true },
				},
			},
		});

		if (!attachment || attachment.ExpenseID !== expenseId) {
			throw new KonNotFoundError("Attachment not found.");
		}

		if (attachment.Expense.Condominium.AdministratorID !== adminId) {
			throw new KonAccessDeniedError();
		}

		const { stream, contentType } = await storageService.downloadAttachmentStream(
			attachment.BlobName,
		);

		if (!stream) {
			throw new KonNotFoundError("Attachment content not found.");
		}

		res.setHeader(
			"Content-Type",
			contentType || attachment.MimeType || "application/octet-stream",
		);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${encodeURIComponent(attachment.FileName)}"`,
		);

		if ("pipe" in stream && typeof stream.pipe === "function") {
			stream.pipe(res);
		} else {
			const readableStream = Readable.from(stream as unknown as AsyncIterable<Uint8Array>);
			readableStream.pipe(res);
		}
	}),
);

// DELETE /expenses/:id/attachments/:attachmentId
router.delete(
	"/:id/attachments/:attachmentId",
	authenticateToken,
	catchError(async (req, res) => {
		const adminId = req.administrator?.administratorId;
		const expenseId = parseInt(req.params.id, 10);
		const attachmentId = req.params.attachmentId;

		if (isNaN(expenseId) || !attachmentId) {
			throw new KonNotFoundError("Attachment not found.");
		}

		const attachment = await prisma.expenseAttachment.findUnique({
			where: { AttachmentID: attachmentId },
			include: {
				Expense: {
					include: { Condominium: true },
				},
			},
		});

		if (!attachment || attachment.ExpenseID !== expenseId) {
			throw new KonNotFoundError("Attachment not found.");
		}

		if (attachment.Expense.Condominium.AdministratorID !== adminId) {
			throw new KonAccessDeniedError();
		}

		await storageService.deleteAttachment(attachment.BlobName);

		await prisma.expenseAttachment.delete({
			where: { AttachmentID: attachmentId },
		});

		res.status(200).json({ message: "Attachment deleted successfully." });
	}),
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
				include: { Condominium: true, Attachments: true },
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
				include: { Attachments: true },
			});

			res.status(200).json({
				expenseId: updated.ExpenseID,
				condominiumId: updated.CondominiumID,
				category: updated.Category as ExpenseCategory,
				amount: Number(updated.Amount.toFixed(2)),
				expenseDate: updated.ExpenseDate.toISOString(),
				description: updated.Description ?? undefined,
				createdAt: updated.CreatedAt.toISOString(),
				attachments: updated.Attachments?.map((att) => ({
					attachmentId: att.AttachmentID,
					expenseId: att.ExpenseID,
					fileName: att.FileName,
					fileSize: att.FileSize,
					mimeType: att.MimeType,
					uploadedAt: att.UploadedAt.toISOString(),
				})) ?? [],
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
				include: { Condominium: true, Attachments: true },
			});

			if (!expense) {
				throw new KonNotFoundError("Expense record not found.");
			}

			if (expense.Condominium.AdministratorID !== adminId) {
				throw new KonAccessDeniedError();
			}

			if (expense.Attachments && expense.Attachments.length > 0) {
				for (const att of expense.Attachments) {
					await storageService.deleteAttachment(att.BlobName).catch(() => {});
				}
			}

			await prisma.expense.delete({
				where: { ExpenseID: expenseId },
			});

			res.status(200).json({ message: "Expense deleted successfully." });
		},
	),
);

export default router;
