import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ExpensesPage } from "../ExpensesPage";
import { Provider } from "@/components/chakraui/provider";
import { CondominiumContext } from "@/contexts/CondominiumContext";
import i18n from "@/i18n/config";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";
import { makeApiRequest } from "@/api/api";

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

describe("ExpensesPage", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		await i18n.changeLanguage("en");
	});

	const renderExpensesPage = (selectedCondo: ICondominiumOutput | null) => {
		const mockContextValue = {
			condominiums: selectedCondo ? [selectedCondo] : [],
			selectedCondominium: selectedCondo,
			loading: false,
			error: null,
			setSelectedCondominium: vi.fn(),
			fetchCondominiums: vi.fn(),
			createCondominium: vi.fn(),
			updateCondominium: vi.fn(),
			deleteCondominium: vi.fn(),
		};

		return render(
			<Provider>
				<CondominiumContext.Provider value={mockContextValue}>
					<BrowserRouter>
						<ExpensesPage />
					</BrowserRouter>
				</CondominiumContext.Provider>
			</Provider>,
		);
	};

	it("renders 'No condominium selected' empty state when no condo active", () => {
		renderExpensesPage(null);
		expect(screen.getByTestId("no-condo-selected-container")).toBeInTheDocument();
		expect(screen.getByText("No condominium selected")).toBeInTheDocument();
	});

	it("renders cash balance card, summary metrics, category filters, and expense table", async () => {
		const condo: ICondominiumOutput = {
			condominiumId: 1,
			administratorId: "admin-123",
			name: "Sunset Condos",
		};

		vi.spyOn(makeApiRequest.expenses, "list").mockResolvedValue({
			data: [
				{
					expenseId: 10,
					condominiumId: 1,
					category: "Utilities",
					amount: 250.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
					description: "Water bill",
					createdAt: "2026-08-19T10:00:00.000Z",
				},
				{
					expenseId: 11,
					condominiumId: 1,
					category: "Cleaning",
					amount: 150.0,
					expenseDate: "2026-08-18T10:00:00.000Z",
					description: "Hallway cleaning",
					createdAt: "2026-08-18T10:00:00.000Z",
				},
			],
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		vi.spyOn(makeApiRequest.expenses, "getCashBalance").mockResolvedValue({
			data: {
				condominiumId: 1,
				totalPayments: 1000.0,
				totalExpenses: 400.0,
				cashBalance: 600.0,
			},
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		renderExpensesPage(condo);

		await waitFor(() => {
			expect(screen.getByTestId("expenses-page-container")).toBeInTheDocument();
		});

		expect(screen.getByTestId("cash-balance-card")).toBeInTheDocument();
		expect(screen.getByTestId("record-expense-btn")).toBeInTheDocument();
		expect(screen.getByTestId("expenses-table")).toBeInTheDocument();
		expect(screen.getByTestId("expense-row-10")).toBeInTheDocument();
		expect(screen.getByTestId("expense-row-11")).toBeInTheDocument();
	});

	it("opens record expense modal with category options (Utilities, Cleaning, Maintenance, Insurance, Other) and submits new expense", async () => {
		const condo: ICondominiumOutput = {
			condominiumId: 1,
			administratorId: "admin-123",
			name: "Sunset Condos",
		};

		vi.spyOn(makeApiRequest.expenses, "list").mockResolvedValue({
			data: [],
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		vi.spyOn(makeApiRequest.expenses, "getCashBalance").mockResolvedValue({
			data: {
				condominiumId: 1,
				totalPayments: 500.0,
				totalExpenses: 0.0,
				cashBalance: 500.0,
			},
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		const createSpy = vi
			.spyOn(makeApiRequest.expenses, "create")
			.mockResolvedValue({
				data: {
					expenseId: 20,
					condominiumId: 1,
					category: "Maintenance",
					amount: 120.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
					description: "Elevator repair",
					createdAt: "2026-08-19T10:00:00.000Z",
				},
				status: 201,
				statusText: "Created",
				headers: {},
				config: {} as never,
			});

		renderExpensesPage(condo);

		await waitFor(() => {
			expect(screen.getByTestId("record-expense-btn")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByTestId("record-expense-btn"));

		// Check modal category dropdown options
		const categorySelect = screen.getByTestId("modal-category-select") as HTMLSelectElement;
		expect(categorySelect).toBeInTheDocument();
		expect(categorySelect.innerHTML).toContain("Utilities");
		expect(categorySelect.innerHTML).toContain("Cleaning");
		expect(categorySelect.innerHTML).toContain("Maintenance");
		expect(categorySelect.innerHTML).toContain("Insurance");
		expect(categorySelect.innerHTML).toContain("Other");

		// Fill in form
		fireEvent.change(categorySelect, { target: { value: "Maintenance" } });
		fireEvent.change(screen.getByTestId("modal-amount-input"), {
			target: { value: "120.00" },
		});
		fireEvent.change(screen.getByTestId("modal-description-input"), {
			target: { value: "Elevator repair" },
		});

		fireEvent.click(screen.getByTestId("modal-save-expense-btn"));

		await waitFor(() => {
			expect(createSpy).toHaveBeenCalledWith({
				condominiumId: 1,
				category: "Maintenance",
				amount: 120,
				expenseDate: expect.any(String),
				description: "Elevator repair",
			});
		});
	});

	it("renders attachments and supports file attachment actions", async () => {
		const condo: ICondominiumOutput = {
			condominiumId: 1,
			administratorId: "admin-123",
			name: "Sunset Condos",
		};

		vi.spyOn(makeApiRequest.expenses, "list").mockResolvedValue({
			data: [
				{
					expenseId: 10,
					condominiumId: 1,
					category: "Utilities",
					amount: 250.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
					description: "Water bill",
					createdAt: "2026-08-19T10:00:00.000Z",
					attachments: [
						{
							attachmentId: "att-1",
							expenseId: 10,
							fileName: "invoice.pdf",
							fileSize: 2048,
							mimeType: "application/pdf",
							uploadedAt: "2026-08-19T10:00:00.000Z",
						},
					],
				},
			],
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		vi.spyOn(makeApiRequest.expenses, "getCashBalance").mockResolvedValue({
			data: {
				condominiumId: 1,
				totalPayments: 1000.0,
				totalExpenses: 250.0,
				cashBalance: 750.0,
			},
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		renderExpensesPage(condo);

		await waitFor(() => {
			expect(screen.getByTestId("expense-attachments-10")).toBeInTheDocument();
		});

		expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
		expect(screen.getByTestId("download-attachment-btn-att-1")).toBeInTheDocument();
		expect(screen.getByTestId("delete-attachment-btn-att-1")).toBeInTheDocument();
	});
});

