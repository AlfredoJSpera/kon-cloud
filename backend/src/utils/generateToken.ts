import "dotenv/config";
import { TokenPayload } from "@interfaces/common";
import {
	access_token_secret,
	refresh_token_secret,
} from "@middleware/authenticateToken";
import jwt, { SignOptions } from "jsonwebtoken";
import ms, { StringValue } from "ms";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "30m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "1d";

export function generateAccessToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, access_token_secret, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
	});
}

export function generateRefreshToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, refresh_token_secret, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
	});
}

export function calculateRefreshTokenExpireDate() {
	return new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRES_IN as StringValue));
}
