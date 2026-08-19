/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { TenantsPage } from "../TenantsPage";
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

describe("TenantsPage", () => {
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
						<TenantsPage />
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

	it("renders heading and tenant list for selected condominium", async () => {
		localStorage.setItem("selected_condominium_id", "101");
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: mockTenants,
		} as any);

		renderPage();

		expect(await screen.findByText("Mario")).toBeInTheDocument();
		expect(screen.getAllByText("Rossi")[0]).toBeInTheDocument();
		expect(
			screen.getAllByText("Apartment 4 - Staircase A")[0],
		).toBeInTheDocument();
		expect(
			screen.getAllByText("mario.rossi@example.com")[0],
		).toBeInTheDocument();
	});

	it("opens unified entry form modal and creates a new tenant", async () => {
		const user = userEvent.setup();
		localStorage.setItem("selected_condominium_id", "101");

		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: mockTenants,
		} as any);

		const newTenant = {
			tenantId: 2,
			condominiumId: 101,
			firstName: "Luigi",
			lastName: "Verdi",
			email: "luigi.verdi@example.com",
			phone: "+39 333 7654321",
			apartmentNumber: "Apartment 12 - Staircase B",
			registrationDate: "2026-08-19T11:00:00.000Z",
		};

		const createSpy = vi
			.spyOn(makeApiRequest.tenants, "create")
			.mockResolvedValue({ data: newTenant } as any);

		renderPage();

		const addBtn = await screen.findByTestId("add-tenant-btn");
		await user.click(addBtn);

		const firstNameInput = screen.getByTestId("tenant-first-name-input");
		const lastNameInput = screen.getByTestId("tenant-last-name-input");
		const apartmentInput = screen.getByTestId("tenant-apartment-input");
		const emailInput = screen.getByTestId("tenant-email-input");
		const phoneInput = screen.getByTestId("tenant-phone-input");
		const submitBtn = screen.getByTestId("tenant-submit-btn");

		await user.type(firstNameInput, "Luigi");
		await user.type(lastNameInput, "Verdi");
		await user.type(apartmentInput, "Apartment 12 - Staircase B");
		await user.type(emailInput, "luigi.verdi@example.com");
		await user.type(phoneInput, "+39 333 7654321");

		await user.click(submitBtn);

		await waitFor(() => {
			expect(createSpy).toHaveBeenCalledWith({
				condominiumId: 101,
				firstName: "Luigi",
				lastName: "Verdi",
				email: "luigi.verdi@example.com",
				phone: "+39 333 7654321",
				apartmentNumber: "Apartment 12 - Staircase B",
			});
		});
	});

	it("prevents submission when contact info is missing", async () => {
		const user = userEvent.setup();
		localStorage.setItem("selected_condominium_id", "101");

		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: mockCondos,
		} as any);

		vi.spyOn(makeApiRequest.tenants, "list").mockResolvedValue({
			data: [],
		} as any);

		const createSpy = vi.spyOn(makeApiRequest.tenants, "create");

		renderPage();

		const addBtn = await screen.findByTestId("add-tenant-btn");
		await user.click(addBtn);

		const firstNameInput = screen.getByTestId("tenant-first-name-input");
		const lastNameInput = screen.getByTestId("tenant-last-name-input");
		const apartmentInput = screen.getByTestId("tenant-apartment-input");
		const submitBtn = screen.getByTestId("tenant-submit-btn");

		await user.type(firstNameInput, "Luigi");
		await user.type(lastNameInput, "Verdi");
		await user.type(apartmentInput, "Apartment 12 - Staircase B");

		// Neither email nor phone is typed
		await user.click(submitBtn);

		expect(createSpy).not.toHaveBeenCalled();
		expect(
			screen.getAllByText(
				"At least one contact method (email or phone number) must be provided.",
			)[0],
		).toBeInTheDocument();
	});
});
