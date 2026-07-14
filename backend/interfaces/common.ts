export interface AdministratorBasicInfo {
	administratorId: string;
	firstName: string;
	lastName: string;
	email: string;
	condominiums: CondominiumBasicInfo[];
}

export interface CondominiumBasicInfo {
	condominiumId: number;
	name: string;
}

export interface IErrorResponse {
	error: boolean;
	message: string;
}
