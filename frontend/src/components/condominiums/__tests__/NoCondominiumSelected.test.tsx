import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NoCondominiumSelected } from "../NoCondominiumSelected";
import { Provider } from "@/components/chakraui/provider";
import i18n from "@/i18n/config";

describe("NoCondominiumSelected Component", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		await i18n.changeLanguage("en");
	});

	it("renders default title, fallback subtext, and navigate button", () => {
		render(
			<Provider>
				<BrowserRouter>
					<NoCondominiumSelected />
				</BrowserRouter>
			</Provider>,
		);

		expect(screen.getByTestId("no-condo-selected-container")).toBeInTheDocument();
		expect(screen.getByText("No condominium selected")).toBeInTheDocument();
		expect(
			screen.getByText("Select or create one from the condominiums page"),
		).toBeInTheDocument();
		expect(screen.getByTestId("goto-condominiums-btn")).toBeInTheDocument();
	});

	it("renders custom description when provided", () => {
		render(
			<Provider>
				<BrowserRouter>
					<NoCondominiumSelected description="Custom no condo subtext" />
				</BrowserRouter>
			</Provider>,
		);

		expect(screen.getByText("Custom no condo subtext")).toBeInTheDocument();
	});
});
