import request, { adminRecord, mockBcrypt, mockPrisma } from "./testHelpers";
import app from "../app";
import { Prisma } from "@generated/prisma/client";

describe("Expense API Endpoints & Pure Cash Flow", () => {
	let authToken: string;

	const mockCondo = {
		CondominiumID: 1,
		AdministratorID: "admin-123",
		Name: "North Tower",
		Address: "123 Main St",
	};

	const mockExpense = {
		ExpenseID: 300,
		CondominiumID: 1,
		Category: "Utilities",
		Amount: new Prisma.Decimal(150.0),
		ExpenseDate: new Date("2026-08-19T10:00:00.000Z"),
		CreatedAt: new Date("2026-08-19T10:00:00.000Z"),
		Description: "Electricity Bill July",
		Condominium: mockCondo,
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

	describe("POST /expenses", () => {
		it("records a paid expense with valid category (Utilities, Cleaning, Maintenance, Insurance, Other)", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.expense.create.mockResolvedValue(mockExpense);

			const response = await request(app)
				.post("/expenses")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					category: "Utilities",
					amount: 150.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
					description: "Electricity Bill July",
				});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				expenseId: 300,
				condominiumId: 1,
				category: "Utilities",
				amount: 150.0,
				expenseDate: "2026-08-19T10:00:00.000Z",
				description: "Electricity Bill July",
				createdAt: "2026-08-19T10:00:00.000Z",
			});
		});

		it("returns 400 when given an invalid category", async () => {
			const response = await request(app)
				.post("/expenses")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					category: "InvalidCategory",
					amount: 150.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("INCORRECT_FIELD_TYPE");
		});

		it("returns 400 when missing required fields", async () => {
			const response = await request(app)
				.post("/expenses")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					condominiumId: 1,
					amount: 150.0,
				});

			expect(response.status).toBe(400);
			expect(response.body.errorCode).toBe("MISSING_REQUIRED_FIELDS");
		});
	});

	describe("GET /expenses", () => {
		it("lists paid expenses for specified condominium", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);

			const response = await request(app)
				.get("/expenses?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].expenseId).toBe(300);
			expect(response.body[0].category).toBe("Utilities");
			expect(response.body[0].amount).toBe(150.0);
		});
	});

	describe("GET /expenses/cash-balance", () => {
		it("calculates total cash balance (total payments minus total paid expenses)", async () => {
			mockPrisma.condominium.findUnique.mockResolvedValue(mockCondo);
			mockPrisma.payment.aggregate.mockResolvedValue({
				_sum: { Amount: new Prisma.Decimal(1000.0) },
			});
			mockPrisma.expense.aggregate.mockResolvedValue({
				_sum: { Amount: new Prisma.Decimal(350.0) },
			});

			const response = await request(app)
				.get("/expenses/cash-balance?condominiumId=1")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				condominiumId: 1,
				totalPayments: 1000.0,
				totalExpenses: 350.0,
				cashBalance: 650.0,
			});
		});
	});

	describe("PUT /expenses/:id", () => {
		it("updates an existing expense entry", async () => {
			const updatedExpense = {
				...mockExpense,
				Amount: new Prisma.Decimal(200.0),
				Category: "Maintenance",
			};
			mockPrisma.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrisma.expense.update.mockResolvedValue(updatedExpense);

			const response = await request(app)
				.put("/expenses/300")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					amount: 200.0,
					category: "Maintenance",
				});

			expect(response.status).toBe(200);
			expect(response.body.amount).toBe(200.0);
			expect(response.body.category).toBe("Maintenance");
		});
	});

	describe("DELETE /expenses/:id", () => {
		it("deletes an expense entry", async () => {
			mockPrisma.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrisma.expense.delete.mockResolvedValue(mockExpense);

			const response = await request(app)
				.delete("/expenses/300")
				.set("Authorization", `Bearer ${authToken}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe("Expense deleted successfully.");
		});
	});
});
