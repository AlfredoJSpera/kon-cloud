/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { DuesPage } from "../DuesPage";
import { Provider } from "@/components/chakraui/provider";
import { CondominiumProvider } from "@/hooks/CondominiumProvider";
import { makeApiRequest } from "@/api/api";
import i18n from "@/i18n/config";

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => ({
		user: {
			administratorId: "admin-123",
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
		},
		logout: vi.fn(),
	}),
}));

describe("DuesPage", () => {
	const mockCondos = [
		{
			condominiumId: 101,
			administratorId: "admin-123",
			name: "Palazzo Venezia",
			address: "Via Roma 10, Milan",
		},
	];

	const mockTenants = [
		{
			tenantId: 1,
			condominiumId: 101,
			firstName: "Mario",
			lastName: "Rossi",
			email: "mario.rossi@example.com",
			phone: "+39 333 1234567",
			apartmentNumber: "Apartment 4 - Staircase A",
			registrationDate: "2026-08-19T10:00:00.000Z",
		},
	];

	const mockDues = [
		{
			dueId: 10,
			tenantId: 1,
			tenantName: "Mario Rossi",
			apartmentNumber: "Apartment 4 - Staircase A",
			amount: 150.0,
			reason: "Monthly Fee",
			dueDate: "2026-09-01T00:00:00.000Z",
			createdAt: "2026-08-19T12:00:00.000Z",
		},
	];

	const mockPayments = [
		{
			paymentId: 20,
			tenantId: 1,
			dueId: 10,
			tenantName: "Mario Rossi",
			amount: 50.0,
			paymentDate: "2026-08-19T11:00:00.000Z",
			notes: "Bank Transfer",
		},
	];

	const mockBalances = [
		{
			tenantId: 1,
			tenantName: "Mario Rossi",
			apartmentNumber: "Apartment 4 - Staircase A",
			totalDues: 150.0,
			totalPayments: 50.0,
			currentBalance: 100.0,
		},
	];

	beforeEach(async () => {
		vi.restoreAllMocks();
		localStorage.clear();
		await i18n.changeLanguage("en");
	});

	const renderPage = () => {
		return render(
			<Provider>
				<CondominiumProvider>
					<BrowserRouter>
						<DuesPage />
					</BrowserRouter>
				</CondominiumProvider>
			</Provider>,
		);
	};

	it("shows message when no condominium is selected", async () => {
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: [],
		} as any);

		renderPage();

		expect(
			await screen.findByText("No condominium selected"),
		).toBeInTheDocument();
	});

	it("renders dues, payments, and tenant current balance correctly", async () => {
		localStorage.setItem("selected_condominium_id", "101");
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);
		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: mockTenants,
		} as any);
		vi.spyOn(makeApiRequest.dues, "list").mockResolvedValue({
			data: mockDues,
		} as any);
		vi.spyOn(makeApiRequest.payments, "list").mockResolvedValue({
			data: mockPayments,
		} as any);
		vi.spyOn(makeApiRequest.dues, "balances").mockResolvedValue({
			data: mockBalances,
		} as any);

		renderPage();

		expect(await screen.findByText("Monthly Fee")).toBeInTheDocument();
		expect(screen.getByTestId("current-balance-display")).toBeInTheDocument();
		expect(screen.getByTestId("total-dues-display")).toBeInTheDocument();
		expect(screen.getByTestId("total-payments-display")).toBeInTheDocument();
	});

	it("opens issue due modal and creates a due amount", async () => {
		const user = userEvent.setup();
		localStorage.setItem("selected_condominium_id", "101");

		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);
		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: mockTenants,
		} as any);
		vi.spyOn(makeApiRequest.dues, "list").mockResolvedValue({
			data: mockDues,
		} as any);
		vi.spyOn(makeApiRequest.payments, "list").mockResolvedValue({
			data: mockPayments,
		} as any);
		vi.spyOn(makeApiRequest.dues, "balances").mockResolvedValue({
			data: mockBalances,
		} as any);

		const createDueSpy = vi
			.spyOn(makeApiRequest.dues, "create")
			.mockResolvedValue({
				data: {
					dueId: 11,
					tenantId: 1,
					tenantName: "Mario Rossi",
					amount: 200.0,
					reason: "Elevator repair",
					dueDate: "2026-09-15T00:00:00.000Z",
					createdAt: "2026-08-19T12:00:00.000Z",
				},
			} as any);

		renderPage();

		const issueBtn = await screen.findByTestId("issue-due-btn");
		await user.click(issueBtn);

		const amountInput = screen.getByTestId("due-amount-input");
		const reasonInput = screen.getByTestId("due-reason-input");
		const submitBtn = screen.getByTestId("due-submit-btn");

		await user.type(amountInput, "200.00");
		await user.type(reasonInput, "Elevator repair");
		await user.click(submitBtn);

		await waitFor(() => {
			expect(createDueSpy).toHaveBeenCalledWith({
				tenantId: 1,
				amount: 200,
				reason: "Elevator repair",
				dueDate: undefined,
			});
		});
	});

	it("opens record payment modal and records a payment with date", async () => {
		const user = userEvent.setup();
		localStorage.setItem("selected_condominium_id", "101");

		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);
		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: mockTenants,
		} as any);
		vi.spyOn(makeApiRequest.dues, "list").mockResolvedValue({
			data: mockDues,
		} as any);
		vi.spyOn(makeApiRequest.payments, "list").mockResolvedValue({
			data: mockPayments,
		} as any);
		vi.spyOn(makeApiRequest.dues, "balances").mockResolvedValue({
			data: mockBalances,
		} as any);

		const createPaymentSpy = vi
			.spyOn(makeApiRequest.payments, "create")
			.mockResolvedValue({
				data: {
					paymentId: 21,
					tenantId: 1,
					amount: 100.0,
					paymentDate: "2026-08-19T11:00:00.000Z",
					notes: "Cash payment",
				},
			} as any);

		renderPage();

		const recordBtn = await screen.findByTestId("record-payment-btn");
		await user.click(recordBtn);

		const amountInput = screen.getByTestId("payment-amount-input");
		const notesInput = screen.getByTestId("payment-notes-input");
		const submitBtn = screen.getByTestId("payment-submit-btn");

		await user.type(amountInput, "100.00");
		await user.type(notesInput, "Cash payment");
		await user.click(submitBtn);

		await waitFor(() => {
			expect(createPaymentSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					tenantId: 1,
					amount: 100,
					notes: "Cash payment",
				}),
			);
		});
	});
});
