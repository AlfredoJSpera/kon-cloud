import jwt from "jsonwebtoken";
import { logger } from "./logger";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "@interfaces/common";
import {
	KonExpiredTokenError,
	KonInvalidTokenError,
	KonMissingTokenError,
} from "../errors/authentication";
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

	// Get the token after "Bearer"
	const token = authHeader && authHeader?.split(" ")[1];

	if (!token) {
		return next(new KonMissingTokenError());
	}

	jwt.verify(token, ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
		if (err) {
			// Throw error to prismaErrorHandler
			if (err.name === "JsonWebTokenError") {
				return next(new KonInvalidTokenError("Invalid token."));
			}
			if (err.name === "TokenExpiredError") {
				return next(new KonExpiredTokenError());
			}
			logger.error({ err }, "Unexpected Token verification failure:");
			return next(new KonInvalidTokenError());
		}

		// Implant administrator info in the request to the endpoint
		req.administrator = {
			administratorId: decoded.administratorId,
			email: decoded.email,
		};

		next(); // Go to selected endpoint
	});
}
