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

describe("PUT /administrators/me", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("updates administrator basic info (firstName, lastName, email)", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		mockPrisma.administrator.findUnique.mockImplementation(async (args: any) => {
			if (args?.where?.Email === "newada@example.com") {
				return null;
			}
			return adminRecord;
		});

		const updatedRecord = {
			...adminRecord,
			FirstName: "AdaUpdated",
			LastName: "LovelaceUpdated",
			Email: "newada@example.com",
		};
		mockPrisma.administrator.update.mockResolvedValue(updatedRecord);

		const response = await request(app)
			.put("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
			.send({
				firstName: "AdaUpdated",
				lastName: "LovelaceUpdated",
				email: "newada@example.com",
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			administratorId: "admin-123",
			firstName: "AdaUpdated",
			lastName: "LovelaceUpdated",
			email: "newada@example.com",
			condominiums: [{ condominiumId: 1, name: "North Tower" }],
		});
	});

	it("updates password when valid currentPassword and newPassword are provided", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);
		mockBcrypt.hash.mockResolvedValue("newHashedPassword" as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		mockPrisma.administrator.update.mockResolvedValue(adminRecord);

		const response = await request(app)
			.put("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
			.send({
				currentPassword: "secret-password",
				newPassword: "brand-new-password",
			});

		expect(response.status).toBe(200);
		expect(mockBcrypt.hash).toHaveBeenCalledWith("brand-new-password", 10);
	});

	it("rejects password update when currentPassword is incorrect", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockImplementation(async (pass: string) => {
			return pass === "secret-password";
		});

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		const response = await request(app)
			.put("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
			.send({
				currentPassword: "wrong-password",
				newPassword: "brand-new-password",
			});

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			error: true,
			message: "Invalid current password.",
			errorCode: "INVALID_CREDENTIALS",
		});
	});

	it("rejects email update if email is already taken by another administrator", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		mockPrisma.administrator.findUnique.mockImplementation(async (args: any) => {
			if (args?.where?.Email === "taken@example.com") {
				return {
					...adminRecord,
					AdministratorID: "other-admin-456",
					Email: "taken@example.com",
				};
			}
			return adminRecord;
		});

		const response = await request(app)
			.put("/administrators/me")
			.set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
			.send({
				email: "taken@example.com",
			});

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: true,
			message: "This email is already registered.",
			errorCode: "EMAIL_ALREADY_EXISTS",
		});
	});

	it("rejects update requests without a token", async () => {
		const response = await request(app).put("/administrators/me").send({
			firstName: "NewName",
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing authentication token.",
			errorCode: "MISSING_AUTHENTICATION_TOKEN",
		});
	});
});


