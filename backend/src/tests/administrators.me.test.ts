import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";

describe("GET /administrators/me", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("returns an administrator profile when a valid access token is provided", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		const response = await request(app)
			.get("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			administratorId: "admin-123",
			firstName: "Ada",
			lastName: "Lovelace",
			email: "ada@example.com",
			condominiums: [{ condominiumId: 1, name: "North Tower" }],
		});
	});

	it("rejects administrator profile requests without a token", async () => {
		const response = await request(app).get("/administrators/me");

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing authentication token.",
			errorCode: "MISSING_AUTHENTICATION_TOKEN",
		});
	});

	it("rejects administrator profile requests when the administrator no longer exists", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValueOnce(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		mockPrisma.administrator.findUnique.mockResolvedValueOnce(null);

		const response = await request(app)
			.get("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: true,
			message: "Resource not found.",
			errorCode: "NOT_FOUND",
		});
	});
});
