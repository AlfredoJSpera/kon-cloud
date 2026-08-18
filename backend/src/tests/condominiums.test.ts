import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";

describe("Condominium API Endpoints", () => {
	let authToken: string;

	beforeEach(async () => {
		jest.clearAllMocks();

		// Helper login to get valid access token
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		authToken = loginResponse.body.accessToken;
	});

	describe("GET /condominiums", () => {
		it("returns list of condominiums for the authenticated administrator", async () => {
			mockPrisma.condominium.findMany.mockResolvedValue([
				{
					CondominiumID: 1,
					AdministratorID: "admin-123",
					Name: "North Tower",
					Address: "123 Main St",
				},
				{
					CondominiumID: 2,
					AdministratorID: "admin-123",
					Name: "South Tower",
					Address: null,
				},
			]);

			const response = await request(app)
				.get("/condominiums")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([
				{
					condominiumId: 1,
					administratorId: "admin-123",
					name: "North Tower",
					address: "123 Main St",
				},
				{
					condominiumId: 2,
					administratorId: "admin-123",
					name: "South Tower",
				},
			]);
		});

		it("rejects list request without authentication token", async () => {
			const response = await request(app).get("/condominiums");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing authentication token.",
				errorCode: "MISSING_AUTHENTICATION_TOKEN",
			});
		});
	});

	describe("POST /condominiums", () => {
		it("creates a new condominium successfully", async () => {
			mockPrisma.condominium.create.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "Sunset Palms Residence",
				Address: "12th Street East, Miami",
			});

			const response = await request(app)
				.post("/condominiums")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: "Sunset Palms Residence",
					address: "12th Street East, Miami",
				});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				condominiumId: 101,
				administratorId: "admin-123",
				name: "Sunset Palms Residence",
				address: "12th Street East, Miami",
			});
		});

		it("rejects creation when required field 'name' is missing", async () => {
			const response = await request(app)
				.post("/condominiums")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					address: "12th Street East",
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing required fields.",
				errorCode: "MISSING_REQUIRED_FIELDS",
			});
		});

		it("rejects creation when field types are invalid", async () => {
			const response = await request(app)
				.post("/condominiums")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: 12345,
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Incorrect field type.",
				errorCode: "INCORRECT_FIELD_TYPE",
			});
		});

		it("rejects creation without authentication token", async () => {
			const response = await request(app).post("/condominiums").send({
				name: "Sunset Palms Residence",
			});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing authentication token.",
				errorCode: "MISSING_AUTHENTICATION_TOKEN",
			});
		});
	});

	describe("GET /condominiums/:id", () => {
		it("returns condominium details for the owner", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "Sunset Palms Residence",
				Address: "12th Street East, Miami",
			});

			const response = await request(app)
				.get("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				condominiumId: 101,
				administratorId: "admin-123",
				name: "Sunset Palms Residence",
				address: "12th Street East, Miami",
			});
		});

		it("returns 403 Access Denied when condominium belongs to another administrator", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "other-admin-456",
				Name: "Sunset Palms Residence",
				Address: "12th Street East, Miami",
			});

			const response = await request(app)
				.get("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(403);
			expect(response.body).toEqual({
				error: true,
				message: "Access denied.",
				errorCode: "ACCESS_DENIED",
			});
		});

		it("returns 404 Not Found when condominium does not exist", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(null);

			const response = await request(app)
				.get("/condominiums/999")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: true,
				message: "Resource not found.",
				errorCode: "NOT_FOUND",
			});
		});

		it("returns 404 Not Found when condominium ID is invalid", async () => {
			const response = await request(app)
				.get("/condominiums/abc")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: true,
				message: "Resource not found.",
				errorCode: "NOT_FOUND",
			});
		});

		it("rejects request without authentication token", async () => {
			const response = await request(app).get("/condominiums/101");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing authentication token.",
				errorCode: "MISSING_AUTHENTICATION_TOKEN",
			});
		});
	});

	describe("PUT /condominiums/:id", () => {
		it("updates condominium details successfully for owner", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "Sunset Palms Residence",
				Address: "12th Street East",
			});
			mockPrisma.condominium.update.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "New Sunset Palms Residence",
				Address: "20th Street East, Miami",
			});

			const response = await request(app)
				.put("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: "New Sunset Palms Residence",
					address: "20th Street East, Miami",
				});

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				condominiumId: 101,
				administratorId: "admin-123",
				name: "New Sunset Palms Residence",
				address: "20th Street East, Miami",
			});
		});

		it("returns 403 Access Denied when updating another administrator's condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "other-admin-456",
				Name: "Sunset Palms Residence",
			});

			const response = await request(app)
				.put("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: "New Sunset Palms Residence",
				});

			expect(response.status).toBe(403);
			expect(response.body).toEqual({
				error: true,
				message: "Access denied.",
				errorCode: "ACCESS_DENIED",
			});
		});

		it("returns 404 Not Found when updating a non-existent condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(null);

			const response = await request(app)
				.put("/condominiums/999")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: "New Sunset Palms Residence",
				});

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: true,
				message: "Resource not found.",
				errorCode: "NOT_FOUND",
			});
		});

		it("returns 400 when payload contains invalid field types", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "Sunset Palms Residence",
			});

			const response = await request(app)
				.put("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: 99999,
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Incorrect field type.",
				errorCode: "INCORRECT_FIELD_TYPE",
			});
		});

		it("rejects request without authentication token", async () => {
			const response = await request(app)
				.put("/condominiums/101")
				.send({ name: "Updated Name" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing authentication token.",
				errorCode: "MISSING_AUTHENTICATION_TOKEN",
			});
		});
	});

	describe("DELETE /condominiums/:id", () => {
		it("deletes a condominium successfully for owner", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "admin-123",
				Name: "Sunset Palms Residence",
			});
			mockPrisma.condominium.delete.mockResolvedValue({
				CondominiumID: 101,
			});

			const response = await request(app)
				.delete("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: "Condominium deleted successfully",
			});
		});

		it("returns 403 Access Denied when deleting another administrator's condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue({
				CondominiumID: 101,
				AdministratorID: "other-admin-456",
				Name: "Sunset Palms Residence",
			});

			const response = await request(app)
				.delete("/condominiums/101")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(403);
			expect(response.body).toEqual({
				error: true,
				message: "Access denied.",
				errorCode: "ACCESS_DENIED",
			});
		});

		it("returns 404 Not Found when deleting a non-existent condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(null);

			const response = await request(app)
				.delete("/condominiums/999")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: true,
				message: "Resource not found.",
				errorCode: "NOT_FOUND",
			});
		});

		it("rejects request without authentication token", async () => {
			const response = await request(app).delete("/condominiums/101");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: true,
				message: "Missing authentication token.",
				errorCode: "MISSING_AUTHENTICATION_TOKEN",
			});
		});
	});
});
