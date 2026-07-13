import { Request, Response, NextFunction } from "express";
import { Prisma } from "@generated/prisma/client";

export const prismaErrorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Prisma Errors
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		switch (err.code) {
			case "P2000": // Value too long for column
				const match = err.message.match(/Column:\s*(\w+)/);
				const columnName = match ? match[1] : "unknown";
				return res.status(400).json({
					error: true,
					message: `The provided value for '${columnName}' is too long.`,
				});

			case "P2002": // Unique constraint failed
				return res.status(409).json({
					error: true,
					message: "This record already exists.",
				});

			default:
				console.error("Unhandled Prisma error:", err.code);
				return res.status(400).json({
					error: true,
					message: "Bad request.",
				});
		}
	}

	// Unknown Error
	console.error("Unhandled Error:", err);
	return res.status(500).json({
		error: true,
		message: "An unexpected error occurred on the server.",
	});
};

export const catchError = (fn: Function) => {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
};
