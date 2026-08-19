export type ExpenseCategory =
	| "Utilities"
	| "Cleaning"
	| "Maintenance"
	| "Insurance"
	| "Other";

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
}

export interface ICashBalanceOutput {
	condominiumId: number;
	totalPayments: number;
	totalExpenses: number;
	cashBalance: number;
}
