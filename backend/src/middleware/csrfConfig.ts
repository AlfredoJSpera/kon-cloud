import { doubleCsrf } from "csrf-csrf";

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET || "your-super-secure-secret-key",
	getSessionIdentifier: (req) =>
		(req.headers["x-session-id"] as string) || req.ip || "",
	cookieName: "__Host-psifi.x-csrf-token",
	cookieOptions: {
		sameSite: "strict",
		secure: process.env.NODE_ENV === "production",
	},
	getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
});
