export interface IDueCreateInput {
	tenantId: number;
	amount: number;
	reason: string;
	dueDate?: string;
}

export interface IDueOutput {
	dueId: number;
	tenantId: number;
	tenantName?: string;
	apartmentNumber?: string;
	amount: number;
	reason: string;
	dueDate: string;
	createdAt: string;
}

export interface IPaymentCreateInput {
	tenantId: number;
	dueId?: number;
	amount: number;
	paymentDate: string;
	notes?: string;
}

export interface IPaymentOutput {
	paymentId: number;
	tenantId: number;
	dueId?: number;
	tenantName?: string;
	amount: number;
	paymentDate: string;
	notes?: string;
}

export interface ITenantBalanceOutput {
	tenantId: number;
	tenantName: string;
	apartmentNumber: string;
	totalDues: number;
	totalPayments: number;
	currentBalance: number;
}
