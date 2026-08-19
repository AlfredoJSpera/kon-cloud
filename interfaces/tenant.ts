export interface ITenantCreateInput {
	condominiumId: number;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	apartmentNumber: string;
}

export interface ITenantUpdateInput {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	apartmentNumber?: string;
}

export interface ITenantOutput {
	tenantId: number;
	condominiumId: number;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	apartmentNumber: string;
	registrationDate: string;
}
