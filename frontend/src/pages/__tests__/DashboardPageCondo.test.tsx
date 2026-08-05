/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "../DashboardPage";
import { Provider } from "@/components/chakraui/provider";
import { CondominiumContext } from "@/contexts/CondominiumContext";
import i18n from "@/i18n/config";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";

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

	it("renders selected condominium data visualization when a condominium is active", async () => {
		const condo: ICondominiumOutput = {
			condominiumId: 55,
			administratorId: "admin-123",
			name: "Grand Horizon Condos",
			address: "100 Skyline Dr",
		};

		renderDashboard(condo);

		expect(
			screen.getByTestId("condo-selected-container"),
		).toBeInTheDocument();
		expect(
			screen.getAllByText("Grand Horizon Condos")[0],
		).toBeInTheDocument();
		expect(
			screen.getByText("Condominium data visualization"),
		).toBeInTheDocument();
	});
});
