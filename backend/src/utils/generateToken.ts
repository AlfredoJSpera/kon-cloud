import { TokenPayload } from "@interfaces/common";
import jwt, { SignOptions } from "jsonwebtoken";
import {
	ACCESS_TOKEN_EXPIRES_IN,
	REFRESH_TOKEN_EXPIRES_IN,
	ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_SECRET,
} from "./envVariables";

export function generateAccessToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
	});
}

export function generateRefreshToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
	});
}
