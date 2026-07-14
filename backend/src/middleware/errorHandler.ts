import { logger } from "./logger";
import { Request, Response, NextFunction } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import {
	KonIncorrectFieldTypeError,
	KonMissingRequiredFieldsError,
	KonNotFoundError,
} from "@errors/validation";
import { IErrorResponse } from "@interfaces/common";
import KonBaseError from "@errors/base";
import {
	KonInvalidCredentialsError,
	KonInvalidTokenError,
	KonMissingTokenError,
} from "@errors/authentication";

export function prismaErrorHandler(
	err: any,
	req: Request,
	res: Response<IErrorResponse>,
	next: NextFunction,
) {
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

	if (err instanceof KonBaseError) {
		logger.debug({ err }, "A Kon Error has occurred:");
		if (err instanceof KonMissingRequiredFieldsError) {
			return res.status(400).json({
				error: true,
				message: "Missing required fields.",
			});
		}
		if (err instanceof KonIncorrectFieldTypeError) {
			return res.status(400).json({
				error: true,
				message: "Incorrect field type.",
			});
		}
		if (err instanceof KonNotFoundError) {
			return res.status(404).json({
				error: true,
				message: "Resource not found.",
			});
		}
		if (err instanceof KonInvalidCredentialsError) {
			return res.status(401).json({
				error: true,
				message: "Invalid credentials.",
			});
		}
		if (err instanceof KonMissingTokenError) {
			return res.status(401).json({
				error: true,
				message: "Missing token.",
			});
		}
		if (err instanceof KonInvalidTokenError) {
			return res.status(401).json({
				error: true,
				message: "Invalid or expired token.",
			});
		}
	}

	// Unknown Error
	logger.error({ err }, "Unhandled Error");
	return res.status(500).json({
		error: true,
		message: "An unexpected error occurred on the server.",
	});
}

export function catchError(fn: Function) {
	return (req: Request, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
}
