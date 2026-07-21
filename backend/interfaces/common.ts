import { Request, Response } from "express";

export type KonApiContract<
	ReqBody = any,
	ResBody = any,
	Params = Record<string, never>,
	ReqQuery = any,
> = {
	Req: Request<Params, ResBody, ReqBody, ReqQuery>;
	Res: Response<ResBody>;
};

export interface TokenPayload {
	administratorId: string;
	email: string;
}

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
	errorCode: string;
}
