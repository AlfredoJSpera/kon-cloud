import "dotenv/config";
import { logger } from "./logger";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Get the token secrets from the .env
const raw_access_token_secret = process.env.SV_ACCESS_TOKEN_SECRET;
const raw_refresh_token_secret = process.env.SV_REFRESH_TOKEN_SECRET;
if (!raw_access_token_secret || !raw_refresh_token_secret) {
	logger.fatal(
		"Could not read SV_ACCESS_TOKEN_SECRET or SV_REFRESH_TOKEN_SECRET from the .env file.",
	);
	process.exit(1);
}
export const access_token_secret = raw_access_token_secret;
export const refresh_token_secret = raw_refresh_token_secret;

// Extend Express' Request to include the authenticated user
declare global {
	namespace Express {
		interface Request {
			administrator?: {
				administratorId: string;
				email: string;
			};
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
		return res.status(401).json({
			error: true,
			message: "Missing token.",
		});
	}

	jwt.verify(token, access_token_secret, (err, decoded: any) => {
		if (err) {
			return res.status(401).json({
				error: true,
				message: "Invalid or expired token.",
			});
		}

		req.administrator = {
			administratorId: decoded.administratorId,
			email: decoded.email,
		};

		next();
	});
}
