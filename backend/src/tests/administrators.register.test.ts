import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";

describe("POST /administrators/register", () => {
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
			message: "Missing required fields.",
			errorCode: "MISSING_REQUIRED_FIELDS",
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
			errorCode: "INCORRECT_FIELD_TYPE",
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
			errorCode: "EMAIL_ALREADY_EXISTS",
		});
	});
});
