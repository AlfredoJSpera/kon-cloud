/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { CondominiumsPage } from "../CondominiumsPage";
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

describe("CondominiumsPage", () => {
	const mockCondos = [
		{
			condominiumId: 101,
			administratorId: "admin-123",
			name: "Palazzo Venezia",
			address: "Via Roma 10, Milan",
		},
		{
			condominiumId: 102,
			administratorId: "admin-123",
			name: "Residenza Sole",
			address: "Corso Italia 45, Rome",
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
						<CondominiumsPage />
					</BrowserRouter>
				</CondominiumProvider>
			</Provider>,
		);
	};

	it("renders heading and condominiums list when loaded", async () => {
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		renderPage();

		expect(
			await screen.findByTestId("condominiums-heading"),
		).toHaveTextContent("Condominiums");
		expect(screen.getAllByText("Palazzo Venezia")[0]).toBeInTheDocument();
		expect(screen.getAllByText("Residenza Sole")[0]).toBeInTheDocument();
	});

	it("opens Add modal when clicking 'Add new' button and creates a condominium", async () => {
		const user = userEvent.setup();
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		const newCondo = {
			condominiumId: 103,
			administratorId: "admin-123",
			name: "Villa Rosa",
			address: "Via Verde 5, Florence",
		};
		const createSpy = vi
			.spyOn(makeApiRequest.condominiums, "create")
			.mockResolvedValue({ data: newCondo } as any);

		renderPage();

		const addBtn = await screen.findByTestId("add-condominium-btn");
		await user.click(addBtn);

		const nameInput = screen.getByTestId("condominium-name-input");
		const locationInput = screen.getByTestId("condominium-location-input");
		const submitBtn = screen.getByTestId("condominium-submit-btn");

		await user.type(nameInput, "Villa Rosa");
		await user.type(locationInput, "Via Verde 5, Florence");
		await user.click(submitBtn);

		await waitFor(() => {
			expect(createSpy).toHaveBeenCalledWith({
				name: "Villa Rosa",
				address: "Via Verde 5, Florence",
			});
		});
	});

	it("allows selecting a condominium to make it active", async () => {
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		renderPage();

		const selectBtns = await screen.findAllByTestId("select-btn-102");
		fireEvent.click(selectBtns[0]);

		await waitFor(() => {
			expect(localStorage.getItem("selected_condominium_id")).toBe("102");
		});
	});
});
