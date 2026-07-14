import { TokenPayload } from "@interfaces/common";
import {
	access_token_secret,
	refresh_token_secret,
} from "@middleware/authenticateToken";
import jwt from "jsonwebtoken";

export function generateAccessToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, access_token_secret, {
		expiresIn: "30m",
	});
}
export function generateRefreshToken(tokenPayload: TokenPayload) {
	return jwt.sign(tokenPayload, refresh_token_secret);
}
