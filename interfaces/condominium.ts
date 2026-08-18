export interface ICondominiumCreateInput {
	name: string;
	address?: string;
}

export interface ICondominiumUpdateInput {
	name?: string;
	address?: string;
}

export interface ICondominiumOutput {
	condominiumId: number;
	administratorId: string;
	name: string;
	address?: string;
}
