import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import request from "./testHelpers";
import app from "../app";
import { generateCsrfToken } from "@middleware/csrfConfigMW";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "@utils/envVariables";
import { TokenPayload } from "@interfaces/common";

function createCsrfCredentials(sessionId = "test-session") {
	const req = {
		headers: { "x-session-id": sessionId },
		cookies: {},
	} as unknown as Request;

	let cookieName = "";
	let cookieValue = "";

	const res = {
		cookie: (name: string, value: string) => {
			cookieName = name;
			cookieValue = value;
		},
	} as unknown as Response;

	const token = generateCsrfToken(req, res);
	return {
		token,
		cookiePair: `${cookieName}=${cookieValue}`,
	};
}

describe("GET /auth/refresh-token", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("refreshes an access token with a valid refresh token and csrf token", async () => {
		const { token: csrfToken, cookiePair: csrfCookie } =
			createCsrfCredentials("test-session");

		const validRefreshToken = jwt.sign(
			{ administratorId: "admin-123", email: "ada@example.com" },
			REFRESH_TOKEN_SECRET,
		);

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("x-session-id", "test-session")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", `refreshToken=${validRefreshToken}; ${csrfCookie}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			accessToken: expect.any(String),
		});

		const decodedAccess = jwt.verify(
			response.body.accessToken,
			ACCESS_TOKEN_SECRET,
		) as TokenPayload;
		expect(decodedAccess.administratorId).toBe("admin-123");
		expect(decodedAccess.email).toBe("ada@example.com");

		expect(response.headers["set-cookie"]).toEqual(
			expect.arrayContaining([
				expect.stringContaining("refreshToken="),
				expect.stringContaining("x-csrf-token="),
			]),
		);
	});

	it("rejects refresh-token requests with an invalid/tampered refresh token", async () => {
		const { token: csrfToken, cookiePair: csrfCookie } =
			createCsrfCredentials("test-session");

		const invalidRefreshToken = "invalid.jwt.token";

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("x-session-id", "test-session")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", `refreshToken=${invalidRefreshToken}; ${csrfCookie}`);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid refresh token.",
			errorCode: "INVALID_REFRESH_TOKEN",
		});
	});

	it("rejects refresh-token requests with an expired refresh token", async () => {
		const { token: csrfToken, cookiePair: csrfCookie } =
			createCsrfCredentials("test-session");

		const expiredRefreshToken = jwt.sign(
			{ administratorId: "admin-123", email: "ada@example.com" },
			REFRESH_TOKEN_SECRET,
			{ expiresIn: "-1s" },
		);

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("x-session-id", "test-session")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", `refreshToken=${expiredRefreshToken}; ${csrfCookie}`);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid refresh token.",
			errorCode: "INVALID_REFRESH_TOKEN",
		});
	});

	it("rejects request when x-csrf-token header does not match csrf cookie", async () => {
		const { cookiePair: csrfCookie } =
			createCsrfCredentials("test-session");

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("x-session-id", "test-session")
			.set("x-csrf-token", "invalid-token-value")
			.set("Cookie", csrfCookie);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid csrf token.",
			errorCode: "INVALID_CSRF_TOKEN",
		});
	});

	it("rejects refresh-token requests without a refresh token cookie", async () => {
		const { token: csrfToken, cookiePair: csrfCookie } =
			createCsrfCredentials("test-session");

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("x-session-id", "test-session")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", csrfCookie);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing refresh token.",
			errorCode: "MISSING_REFRESH_TOKEN",
		});
	});

	it("rejects refresh-token requests without a csrf token cookie", async () => {
		const validRefreshToken = jwt.sign(
			{ administratorId: "admin-123", email: "ada@example.com" },
			REFRESH_TOKEN_SECRET,
		);

		const response = await request(app)
			.get("/auth/refresh-token")
			.set("Cookie", `refreshToken=${validRefreshToken}`);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid csrf token.",
			errorCode: "INVALID_CSRF_TOKEN",
		});
	});

	it("rejects refresh-token requests without any cookies", async () => {
		const response = await request(app).get("/auth/refresh-token");

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid csrf token.",
			errorCode: "INVALID_CSRF_TOKEN",
		});
	});
});
