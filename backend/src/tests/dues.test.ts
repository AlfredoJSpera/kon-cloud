import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";
import { Prisma } from "@generated/prisma/client";

describe("Due API Endpoints", () => {
	let authToken: string;

	const mockCondo = {
		CondominiumID: 1,
		AdministratorID: "admin-123",
		Name: "North Tower",
		Address: "123 Main St",
	};

	const mockTenant = {
		TenantID: 10,
		CondominiumID: 1,
		FirstName: "Mario",
		LastName: "Rossi",
		Email: "mario.rossi@example.com",
		Phone: "+39 333 1234567",
		ApartmentNumber: "Apartment 4 - Staircase A",
		RegistrationDate: new Date("2026-08-19T10:00:00.000Z"),
		Condominium: mockCondo,
	};

	const mockDue = {
		DueID: 100,
		TenantID: 10,
		Amount: new Prisma.Decimal(150.5),
		Reason: "Monthly Condo Maintenance",
		CreatedAt: new Date("2026-08-19T12:00:00.000Z"),
		Tenant: mockTenant,
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		mockPrisma.administrator.findUnique.mockResolvedValue(adminRecord);
		mockBcrypt.compare.mockResolvedValue(true as never);

		const loginResponse = await request(app).post("/auth/login").send({
			email: "ada@example.com",
			password: "secret-password",
		});

		authToken = loginResponse.body.accessToken;
	});

	describe("POST /dues", () => {
		it("creates due amount for tenant with amount and descriptive reason", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
			mockPrisma.due.create.mockResolvedValue(mockDue);

			const response = await request(app)
				.post("/dues")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
					amount: 150.5,
					reason: "Monthly Condo Maintenance",
				});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				dueId: 100,
				tenantId: 10,
				tenantName: "Mario Rossi",
				apartmentNumber: "Apartment 4 - Staircase A",
				amount: 150.5,
				reason: "Monthly Condo Maintenance",
				createdAt: "2026-08-19T12:00:00.000Z",
			});
		});

		it("returns 400 when missing required fields", async () => {
			const response = await request(app)
				.post("/dues")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("MISSING_REQUIRED_FIELDS");
		});

		it("returns 400 when amount is zero or negative", async () => {
			const response = await request(app)
				.post("/dues")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
					amount: -50,
					reason: "Invalid negative amount",
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("INCORRECT_FIELD_TYPE");
		});

		it("returns 403 when tenant belongs to another administrator's condominium", async () => {
			const otherTenant = {
				...mockTenant,
				Condominium: {
					...mockCondo,
					AdministratorID: "other-admin-999",
				},
			};
			mockPrisma.tenant.findUnique.mockResolvedValue(otherTenant);

			const response = await request(app)
				.post("/dues")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
					amount: 200,
					reason: "Building renovation",
				});

			expect(response.status).toBe(403);
			expect(response.body.errorCode).toBe("ACCESS_DENIED");
		});
	});

	describe("GET /dues", () => {
		it("lists dues for specified condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.due.findMany.mockResolvedValue([mockDue]);

			const response = await request(app)
				.get("/dues?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].dueId).toBe(100);
			expect(response.body[0].amount).toBe(150.5);
			expect(response.body[0].reason).toBe("Monthly Condo Maintenance");
		});
	});

	describe("GET /dues/balances", () => {
		it("calculates tenant current balances correctly (dues minus payments)", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			const tenantWithLedger = {
				...mockTenant,
				Dues: [
					{ Amount: new Prisma.Decimal(200) },
					{ Amount: new Prisma.Decimal(100) },
				],
				Payments: [{ Amount: new Prisma.Decimal(120) }],
			};
			mockPrisma.tenant.findMany.mockResolvedValue([tenantWithLedger]);

			const response = await request(app)
				.get("/dues/balances?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([
				{
					tenantId: 10,
					tenantName: "Mario Rossi",
					apartmentNumber: "Apartment 4 - Staircase A",
					totalDues: 300,
					totalPayments: 120,
					currentBalance: 180,
				},
			]);
		});
	});

	describe("DELETE /dues/:id", () => {
		it("deletes due amount", async () => {
			mockPrisma.due.findUnique.mockResolvedValue(mockDue);
			mockPrisma.due.delete.mockResolvedValue(mockDue);

			const response = await request(app)
				.delete("/dues/100")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe("Due deleted successfully.");
		});
	});
});
