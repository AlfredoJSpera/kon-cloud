import { logger } from "./logger";
import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { IErrorResponse } from "@interfaces/common";
import KonBaseError from "../errors/base";

export function prismaErrorHandler(
	err: any,
	req: Request,
	res: Response<IErrorResponse>,
	next: NextFunction,
) {
	// Handle Prisma Errors
	if (err instanceof PrismaClientKnownRequestError) {
		logger.debug({ err }, "A Prisma Error has occurred:");
		switch (err.code) {
			case "P2000": // Value too long for column
				return res.status(400).json({
					error: true,
					message: "One of the provided fields is too long.",
				});

			case "P2002": // Unique constraint failed
				return res.status(409).json({
					error: true,
					message: "This record already exists.",
				});

			default:
				logger.error(`Unhandled Prisma error code ${err.code}`);
				return res.status(400).json({
					error: true,
					message: "Bad request.",
				});
		}
	}

	// Handle Kon Errors
	if (err instanceof KonBaseError) {
		logger.debug({ err }, "A Kon Error has occurred:");

		return res.status(err.statusCode).json({
			error: true,
			message: err.message,
		});
	}

	// Handle Unknown Errors
	logger.error({ err }, "Unhandled Error:");
	return res.status(500).json({
		error: true,
		message: "An error occurred on the server.",
	});
}

export function catchError(fn: Function) {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
}
