export type ExpenseCategory =
	| "Utilities"
	| "Cleaning"
	| "Maintenance"
	| "Insurance"
	| "Other";

export interface IExpenseAttachmentOutput {
	attachmentId: string;
	expenseId: number;
	fileName: string;
	fileSize: number;
	mimeType: string;
	uploadedAt: string;
}

export interface IExpenseCreateInput {
	condominiumId: number;
	category: ExpenseCategory;
	amount: number;
	expenseDate: string;
	description?: string;
}

export interface IExpenseUpdateInput {
	category?: ExpenseCategory;
	amount?: number;
	expenseDate?: string;
	description?: string;
}

export interface IExpenseOutput {
	expenseId: number;
	condominiumId: number;
	category: ExpenseCategory;
	amount: number;
	expenseDate: string;
	description?: string;
	createdAt: string;
	attachments?: IExpenseAttachmentOutput[];
}

export interface ICashBalanceOutput {
	condominiumId: number;
	totalPayments: number;
	totalExpenses: number;
	cashBalance: number;
}
