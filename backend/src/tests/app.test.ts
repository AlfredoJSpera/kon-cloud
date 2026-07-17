import request from "supertest";

jest.mock("@middleware/logger", () => ({
	logger: {
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
	},
	loggerHttp: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock(
	"cors",
	() => () => (_req: unknown, _res: unknown, next: () => void) => next(),
);

jest.mock("express-rate-limit", () => ({
	rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("bcrypt", () => ({
	__esModule: true,
	default: {
		hash: jest.fn(),
		compare: jest.fn(),
	},
	hash: jest.fn(),
	compare: jest.fn(),
}));

jest.mock("@lib/prisma", () => ({
	prisma: {
		administrator: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	},
}));

import app from "../app";
import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockPrisma = prisma as unknown as {
	administrator: {
		findUnique: jest.Mock;
		create: jest.Mock;
	};
};

const adminRecord = {
	AdministratorID: "admin-123",
	FirstName: "Ada",
	LastName: "Lovelace",
	Email: "ada@example.com",
	PasswordHash: "hashed-password",
	Condominiums: [
		{
			CondominiumID: 1,
			Name: "North Tower",
		},
	],
};

describe("administrator registration", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("registers an administrator", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue(null);
		mockPrisma.administrator.create.mockResolvedValue({
			AdministratorID: "admin-new-1",
		});
		mockBcrypt.hash.mockResolvedValue("hashed-password" as never);

		const response = await request(app)
			.post("/administrators/register")
			.send({
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.com",
				password: "secret-password",
			});

		expect(response.status).toBe(201);
		expect(response.body).toEqual({ administratorId: "admin-new-1" });
		expect(mockPrisma.administrator.findUnique).toHaveBeenCalledWith({
			where: { Email: "ada@example.com" },
		});
		expect(mockBcrypt.hash).toHaveBeenCalledWith("secret-password", 10);
		expect(mockPrisma.administrator.create).toHaveBeenCalledWith({
			data: {
				FirstName: "Ada",
				LastName: "Lovelace",
				Email: "ada@example.com",
				PasswordHash: "hashed-password",
			},
		});
	});

	it("rejects registration with missing required fields", async () => {
		const response = await request(app)
			.post("/administrators/register")
			.send({
				firstName: "Ada",
				email: "ada@example.com",
				password: "secret-password",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing required field.",
		});
	});

	it("rejects registration with incorrect field types", async () => {
		const response = await request(app)
			.post("/administrators/register")
			.send({
				firstName: 123,
				lastName: "Lovelace",
				email: "ada@example.com",
				password: "secret-password",
			});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Incorrect field type.",
		});
	});

	it("rejects registration when the email already exists", async () => {
		mockPrisma.administrator.findUnique.mockResolvedValue({
			AdministratorID: "admin-123",
		});

		const response = await request(app)
			.post("/administrators/register")
			.send({
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.com",
				password: "secret-password",
			});

		expect(response.status).toBe(409);
		expect(response.body).toEqual({
			error: true,
			message: "This email is already registered.",
		});
	});
});

describe("administrator login", () => {
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
			message: "Missing required field.",
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
		});
	});
});

describe("access token refreshing", () => {
	afterEach(() => {
		jest.clearAllMocks();
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

		const csrfCookie = (
			Array.isArray(loginResponse.headers["set-cookie"])
				? loginResponse.headers["set-cookie"]
				: [loginResponse.headers["set-cookie"]]
		).find((cookie: string) =>
			cookie.startsWith("__Host-psifi.x-csrf-token="),
		);

		const response = await request(app)
			.post("/auth/refresh-token")
			.set("Cookie", csrfCookie)
			.set("x-csrf-token", loginResponse.body.csrfToken)
			.send();

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: true,
			message: "Missing refresh token.",
		});
	});
});

describe("current administrator profile", () => {
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
			message: "Missing token.",
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
		});
	});
});
