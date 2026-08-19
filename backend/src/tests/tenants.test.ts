import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";

describe("Tenant API Endpoints", () => {
	let authToken: string;

	const mockCondo = {
		CondominiumID: 1,
		AdministratorID: "admin-123",
		Name: "North Tower",
		Address: "123 Main St",
	};

	const otherCondo = {
		CondominiumID: 2,
		AdministratorID: "other-admin-456",
		Name: "South Tower",
		Address: "456 Other St",
	};

	const mockTenantData = {
		TenantID: 10,
		CondominiumID: 1,
		FirstName: "Mario",
		LastName: "Rossi",
		Email: "mario.rossi@example.com",
		Phone: "+39 333 1234567",
		ApartmentNumber: "Apartment 4 - Staircase A",
		RegistrationDate: new Date("2026-08-19T10:00:00.000Z"),
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		// Login helper to retrieve auth token
		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		authToken = loginResponse.body.accessToken;
	});

	describe("GET /tenants", () => {
		it("returns list of tenants for specified condominium owned by admin", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.tenant.findMany.mockResolvedValue([mockTenantData]);

			const response = await request(app)
				.get("/tenants?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([
				{
					tenantId: 10,
					condominiumId: 1,
					firstName: "Mario",
					lastName: "Rossi",
					email: "mario.rossi@example.com",
					phone: "+39 333 1234567",
					apartmentNumber: "Apartment 4 - Staircase A",
					registrationDate: "2026-08-19T10:00:00.000Z",
				},
			]);
		});

		it("returns 400 when condominiumId query parameter is missing", async () => {
			const response = await request(app)
				.get("/tenants")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("MISSING_REQUIRED_FIELDS");
		});

		it("returns 403 when requesting tenants for another admin's condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(otherCondo);

			const response = await request(app)
				.get("/tenants?condominiumId=2")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(403);
			expect(response.body.errorCode).toBe("ACCESS_DENIED");
		});
	});

	describe("POST /tenants", () => {
		it("creates a new tenant successfully with email and phone", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.tenant.findFirst.mockResolvedValue(null);
			mockPrisma.tenant.create.mockResolvedValue(mockTenantData);

			const response = await request(app)
				.post("/tenants")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					firstName: "Mario",
					lastName: "Rossi",
					email: "mario.rossi@example.com",
					phone: "+39 333 1234567",
					apartmentNumber: "Apartment 4 - Staircase A",
				});

			expect(response.status).toBe(201);
			expect(response.body.tenantId).toBe(10);
			expect(response.body.firstName).toBe("Mario");
			expect(response.body.apartmentNumber).toBe(
				"Apartment 4 - Staircase A",
			);
		});

		it("rejects creation when required fields are missing", async () => {
			const response = await request(app)
				.post("/tenants")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					firstName: "Mario",
					// missing lastName and apartmentNumber
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("MISSING_REQUIRED_FIELDS");
		});

		it("creates tenant successfully without email or phone", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.tenant.findFirst.mockResolvedValue(null);
			mockPrisma.tenant.create.mockResolvedValue({
				...mockTenantData,
				Email: null,
				Phone: null,
			});

			const response = await request(app)
				.post("/tenants")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					firstName: "Mario",
					lastName: "Rossi",
					apartmentNumber: "Apt 1",
				});

			expect(response.status).toBe(201);
			expect(response.body.firstName).toBe("Mario");
			expect(response.body.email).toBeUndefined();
			expect(response.body.phone).toBeUndefined();
		});

		it("rejects creation when email format is invalid", async () => {
			const response = await request(app)
				.post("/tenants")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					firstName: "Mario",
					lastName: "Rossi",
					email: "invalid-email",
					apartmentNumber: "Apt 1",
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("INCORRECT_FIELD_TYPE");
		});

		it("returns 409 Conflict when duplicate tenant exists in condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.tenant.findFirst.mockResolvedValue(mockTenantData);

			const response = await request(app)
				.post("/tenants")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					firstName: "Mario",
					lastName: "Rossi",
					email: "mario.rossi@example.com",
					apartmentNumber: "Apartment 4 - Staircase A",
				});

			expect(response.status).toBe(409);
			expect(response.body.errorCode).toBe("TENANT_ALREADY_EXISTS");
		});
	});

	describe("GET /tenants/:id", () => {
		it("returns tenant details for authorized administrator", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue({
				...mockTenantData,
				Condominium: mockCondo,
			});

			const response = await request(app)
				.get("/tenants/10")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.tenantId).toBe(10);
		});

		it("returns 403 when tenant belongs to another administrator's condominium", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue({
				...mockTenantData,
				Condominium: otherCondo,
			});

			const response = await request(app)
				.get("/tenants/10")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(403);
		});

		it("returns 404 when tenant is not found", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue(null);

			const response = await request(app)
				.get("/tenants/999")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /tenants/:id", () => {
		it("updates tenant details successfully", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue({
				...mockTenantData,
				Condominium: mockCondo,
			});
			mockPrisma.tenant.findFirst.mockResolvedValue(null);
			mockPrisma.tenant.update.mockResolvedValue({
				...mockTenantData,
				ApartmentNumber: "Apartment 5 - Staircase B",
			});

			const response = await request(app)
				.put("/tenants/10")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					apartmentNumber: "Apartment 5 - Staircase B",
				});

			expect(response.status).toBe(200);
			expect(response.body.apartmentNumber).toBe(
				"Apartment 5 - Staircase B",
			);
		});
	});

	describe("DELETE /tenants/:id", () => {
		it("deletes tenant successfully", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue({
				...mockTenantData,
				Condominium: mockCondo,
			});
			mockPrisma.tenant.delete.mockResolvedValue(mockTenantData);

			const response = await request(app)
				.delete("/tenants/10")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe("Tenant deleted successfully");
		});
	});
});
