import { COOKIE_MAX_AGE, CSRF_TOKEN_SECRET } from "@utils/envVariables";
import { doubleCsrf } from "csrf-csrf";

const isProduction = process.env.NODE_ENV === "production";

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
	getSecret: () => CSRF_TOKEN_SECRET,
	getSessionIdentifier: (req) =>
		(req.headers["x-session-id"] as string) || req.ip || "",
	cookieName: isProduction
		? "__Host-psifi.x-csrf-token"
		: "psifi.x-csrf-token",
	cookieOptions: {
		sameSite: "strict",
		path: "/",
		httpOnly: false,
		secure: isProduction,
		maxAge: COOKIE_MAX_AGE,
	},
	size: 32,
	ignoredMethods: ["HEAD", "OPTIONS"],
	getCsrfTokenFromRequest: (req) =>
		(req.headers["x-csrf-token"] as string) || "",
});
