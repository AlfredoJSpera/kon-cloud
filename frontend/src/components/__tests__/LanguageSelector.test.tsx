import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSelector } from "../dashboard-container/top/LanguageSelector";
import { Provider } from "@/components/chakraui/provider";
import i18n from "@/i18n/config";

describe("LanguageSelector Component", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
	});

	it("renders the language selector button displaying current language code", () => {
		render(
			<Provider>
				<LanguageSelector />
			</Provider>,
		);

		const button = screen.getByRole("button", { name: /select language/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent(/en/i);
	});

	it("changes language when a language option is selected", async () => {
		const user = userEvent.setup();
		render(
			<Provider>
				<LanguageSelector />
			</Provider>,
		);

		const button = screen.getByRole("button", { name: /select language/i });
		await user.click(button);

		const itOption = await screen.findByText("Italiano");
		await user.click(itOption);

		await waitFor(() => {
			expect(i18n.language).toContain("it");
		});
		expect(
			screen.getByRole("button", { name: /select language/i }),
		).toHaveTextContent(/it/i);
	});
});
