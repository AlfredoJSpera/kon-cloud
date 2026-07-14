import "dotenv/config";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { logger } from "./logger";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "@interfaces/common";
import {
	KonExpiredTokenError,
	KonInvalidTokenError,
	KonMissingTokenError,
} from "@errors/authentication";

// Get the token secrets from the .env
if (
	!process.env.SV_ACCESS_TOKEN_SECRET ||
	!process.env.SV_REFRESH_TOKEN_SECRET
) {
	logger.fatal(
		"Could not read SV_ACCESS_TOKEN_SECRET or SV_REFRESH_TOKEN_SECRET from the .env file.",
	);
	process.exit(1);
}
export const access_token_secret = process.env.SV_ACCESS_TOKEN_SECRET;
export const refresh_token_secret = process.env.SV_REFRESH_TOKEN_SECRET;

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

	jwt.verify(token, access_token_secret, (err: any, decoded: any) => {
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
