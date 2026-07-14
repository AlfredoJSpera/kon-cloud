import {
	access_token_secret,
	refresh_token_secret,
} from "@middleware/authenticateToken";
import jwt from "jsonwebtoken";

export function generateAccessToken(tokenPayload: any) {
	return jwt.sign(tokenPayload, access_token_secret, {
		expiresIn: "30m",
	});
}
export function generateRefreshToken(tokenPayload: any) {
	return jwt.sign(tokenPayload, refresh_token_secret);
}
