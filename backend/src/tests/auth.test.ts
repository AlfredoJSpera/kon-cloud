import request, {
	adminRecord,
	getCsrfCookie,
	mockBcrypt,
	mockPrisma,
} from "./testHelpers";
import app from "../app";

describe("auth routes", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("logs an administrator in and returns tokens", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const response = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		expect(response.status).toBe(200);
		expect(response.body.accessToken).toEqual(expect.any(String));
		expect(response.body.csrfToken).toEqual(expect.any(String));
		expect(response.body.profile).toEqual({
			administratorId: "admin-123",
			firstName: "Ada",
			lastName: "Lovelace",
			email: "ada@example.com",
			condominiums: [{ condominiumId: 1, name: "North Tower" }],
		});
		expect(response.headers["set-cookie"]).toEqual(
			expect.arrayContaining([expect.stringContaining("refreshToken=")]),
		);
	});

	it("rejects login when credentials are missing", async () => {
		const response = await request(app).post("/auth/login").send({
			email: "ada@example.com",
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing required fields.",
			errorCode: "MISSING_REQUIRED_FIELDS",
		});
	});

	it("rejects login when the password is invalid", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(false as never);

		const response = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "wrong-password",
		});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid credentials.",
			errorCode: "INVALID_CREDENTIALS",
		});
	});

	it("rejects login when the email is invalid", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(null);

		const response = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid credentials.",
			errorCode: "INVALID_CREDENTIALS",
		});
	});

	it("refreshes an access token with a valid refresh token and csrf token", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const agent = request.agent(app);
		const loginResponse = await agent.post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		const refreshResponse = await agent
			.post("/auth/refresh-token")
			.set("x-csrf-token", loginResponse.body.csrfToken)
			.send();

		expect(refreshResponse.status).toBe(200);
		expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
		expect(refreshResponse.headers["set-cookie"]).toEqual(
			expect.arrayContaining([expect.stringContaining("refreshToken=")]),
		);
	});

	it("rejects refresh-token requests without a refresh token cookie", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		const csrfCookie = getCsrfCookie(loginResponse.headers["set-cookie"]);

		const response = await request(app)
			.post("/auth/refresh-token")
			.set("Cookie", csrfCookie ?? "")
			.set("x-csrf-token", loginResponse.body.csrfToken)
			.send();

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing refresh token.",
			errorCode: "MISSING_REFRESH_TOKEN",
		});
	});
});
