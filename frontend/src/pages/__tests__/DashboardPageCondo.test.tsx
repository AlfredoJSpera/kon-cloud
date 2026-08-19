import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "../DashboardPage";
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

describe("DashboardPage Condominium state integration", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		await i18n.changeLanguage("en");
	});

	const renderDashboard = (selectedCondo: ICondominiumOutput | null) => {
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
						<DashboardPage />
					</BrowserRouter>
				</CondominiumContext.Provider>
			</Provider>,
		);
	};

	it("renders 'No condominium selected' state when no condominium is active", async () => {
		renderDashboard(null);

		expect(
			screen.getByTestId("no-condo-selected-container"),
		).toBeInTheDocument();
		expect(screen.getByText("No condominium selected")).toBeInTheDocument();
		expect(
			screen.getByText("Select or create one from the condominiums page"),
		).toBeInTheDocument();
		expect(screen.getByTestId("goto-condominiums-btn")).toBeInTheDocument();
	});

	it("renders total cash balance and financial summary when a condominium is active", async () => {
		const condo: ICondominiumOutput = {
			condominiumId: 55,
			administratorId: "admin-123",
			name: "Grand Horizon Condos",
			address: "100 Skyline Dr",
		};

		vi.spyOn(makeApiRequest.expenses, "getCashBalance").mockResolvedValue({
			data: {
				condominiumId: 55,
				totalPayments: 2000.0,
				totalExpenses: 500.0,
				cashBalance: 1500.0,
			},
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		vi.spyOn(makeApiRequest.expenses, "list").mockResolvedValue({
			data: [
				{
					expenseId: 1,
					condominiumId: 55,
					category: "Utilities",
					amount: 500.0,
					expenseDate: "2026-08-19T10:00:00.000Z",
					description: "Electricity",
					createdAt: "2026-08-19T10:00:00.000Z",
				},
			],
			status: 200,
			statusText: "OK",
			headers: {},
			config: {} as never,
		});

		renderDashboard(condo);

		expect(
			screen.getByTestId("condo-selected-container"),
		).toBeInTheDocument();
		expect(
			screen.getAllByText("Grand Horizon Condos")[0],
		).toBeInTheDocument();

		await waitFor(() => {
			expect(
				screen.getByTestId("dashboard-cash-balance-card"),
			).toBeInTheDocument();
		});

		// Check that template placeholders are removed
		expect(screen.queryByText("Project files")).not.toBeInTheDocument();
		expect(screen.queryByText("Active sessions")).not.toBeInTheDocument();
		expect(screen.queryByText("Placeholder tiles for the dashboard view shown in the mockup.")).not.toBeInTheDocument();
	});
});
