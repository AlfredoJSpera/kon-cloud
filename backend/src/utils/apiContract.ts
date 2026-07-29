import { type Request, type Response } from "express";

export type KonApiContract<
	ReqBody = any,
	ResBody = any,
	Params = Record<string, never>,
	ReqQuery = any,
> = {
	Req: Request<Params, ResBody, ReqBody, ReqQuery>;
	Res: Response<ResBody>;
};
