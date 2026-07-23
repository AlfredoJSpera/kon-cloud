import { logger } from "./loggerMW";
import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { IErrorResponse } from "@interfaces/common";
import KonBaseError from "@errors/baseError";

export function routeErrorHandler(
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
					errorCode: "FIELD_TOO_LONG",
				});

			case "P2002": // Unique constraint failed
				return res.status(409).json({
					error: true,
					message: "This record already exists.",
					errorCode: "RECORD_ALREADY_EXISTS",
				});

			default:
				logger.error(`Unhandled Prisma error code ${err.code}`);
				return res.status(400).json({
					error: true,
					message: "Bad request.",
					errorCode: "BAD_REQUEST",
				});
		}
	}

	// Handle Kon Errors
	if (err instanceof KonBaseError) {
		logger.debug({ err }, "A Kon Error has occurred:");

		return res.status(err.statusCode).json({
			error: true,
			message: err.message,
			errorCode: err.errorCode,
		});
	}

	if (err.message === "invalid csrf token") {
		logger.debug({ err }, "A CSRF Error has occurred:");
		return res.status(err.statusCode).json({
			error: true,
			message: "Invalid csrf token.",
			errorCode: "INVALID_CSRF_TOKEN",
		});
	}

	// Handle bad JSON
	try {
		JSON.parse(req.body);
	} catch (error) {
		logger.debug({ err }, "A JSON Syntax Error has occurred:");
		return res.status(400).json({
			error: true,
			message: "Bad JSON request.",
			errorCode: "BAD_JSON",
		});
	}

	// Handle Unknown Errors
	logger.error({ err }, "Unhandled Error:");
	return res.status(500).json({
		error: true,
		message: "An error occurred on the server.",
		errorCode: "SERVER_ERROR",
	});
}

export function catchError(fn: Function) {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
}
