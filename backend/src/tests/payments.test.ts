import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";
import { Prisma } from "@generated/prisma/client";

describe("Payment API Endpoints", () => {
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

	const mockPayment = {
		PaymentID: 200,
		TenantID: 10,
		DueID: 100,
		Amount: new Prisma.Decimal(100.0),
		PaymentDate: new Date("2026-08-19T11:00:00.000Z"),
		Notes: "Bank Transfer #123",
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

	describe("POST /payments", () => {
		it("records a payment with amount, paymentDate, and notes", async () => {
			mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
			mockPrisma.payment.create.mockResolvedValue(mockPayment);

			const response = await request(app)
				.post("/payments")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
					dueId: 100,
					amount: 100.0,
					paymentDate: "2026-08-19T11:00:00.000Z",
					notes: "Bank Transfer #123",
				});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				paymentId: 200,
				tenantId: 10,
				dueId: 100,
				tenantName: "Mario Rossi",
				amount: 100.0,
				paymentDate: "2026-08-19T11:00:00.000Z",
				notes: "Bank Transfer #123",
			});
		});

		it("returns 400 when missing paymentDate or amount", async () => {
			const response = await request(app)
				.post("/payments")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					tenantId: 10,
					amount: 100,
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("MISSING_REQUIRED_FIELDS");
		});
	});

	describe("GET /payments", () => {
		it("lists payments for specified condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);

			const response = await request(app)
				.get("/payments?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].paymentId).toBe(200);
			expect(response.body[0].amount).toBe(100.0);
			expect(response.body[0].paymentDate).toBe(
				"2026-08-19T11:00:00.000Z",
			);
		});
	});

	describe("DELETE /payments/:id", () => {
		it("deletes a payment entry", async () => {
			mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
			mockPrisma.payment.delete.mockResolvedValue(mockPayment);

			const response = await request(app)
				.delete("/payments/200")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe("Payment deleted successfully.");
		});
	});
});
