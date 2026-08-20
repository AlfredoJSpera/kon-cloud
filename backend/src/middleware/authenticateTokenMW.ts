import jwt from "jsonwebtoken";
import { logger } from "./loggerMW";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "@interfaces/common";
import {
	KonExpiredAuthenticationTokenError,
	KonInvalidAuthenticationTokenError,
	KonMissingAuthenticationTokenError,
} from "@errors/authenticationErrors";
import { ACCESS_TOKEN_SECRET } from "@utils/envVariables";

// Extend Express' Request to include the authenticated user
declare global {
	namespace Express {
		interface Request {
			administrator?: TokenPayload;
		}
	}
}

export function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const authHeader = req.headers["authorization"];

	// Get the token after "Bearer" or from query parameter
	const tokenFromHeader = authHeader && authHeader?.split(" ")[1];
	const tokenFromQuery =
		typeof req.query.token === "string" ? req.query.token : undefined;
	const token = tokenFromHeader || tokenFromQuery;

	if (!token) {
		return next(new KonMissingAuthenticationTokenError());
	}

	jwt.verify(token, ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
		if (err) {
			// Throw error to errorHandler
			if (err.name === "TokenExpiredError") {
				return next(new KonExpiredAuthenticationTokenError());
			}
			if (
				err.name === "JsonWebTokenError" &&
				err.message === "jwt malformed"
			) {
				return next(new KonInvalidAuthenticationTokenError());
			}
			logger.error({ err }, "Unexpected Token verification failure:");
			return next(new KonInvalidAuthenticationTokenError());
		}

		// Implant administrator info in the request to the endpoint
		req.administrator = {
			administratorId: decoded.administratorId,
			email: decoded.email,
		};

		next(); // Go to selected endpoint
	});
}
