/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { SettingsPage } from "../SettingsPage";
import { Provider } from "@/components/chakraui/provider";
import { CondominiumProvider } from "@/hooks/CondominiumProvider";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import i18n from "@/i18n/config";

const mockUpdateProfile = vi.fn();
const mockUser = {
	administratorId: "admin-123",
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	condominiums: [],
};

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => ({
		user: mockUser,
		updateProfile: mockUpdateProfile,
		logout: vi.fn(),
	}),
}));

vi.mock("@/components/chakraui/toaster", () => ({
	toaster: {
		create: vi.fn(),
	},
}));

describe("SettingsPage", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		localStorage.clear();
		await i18n.changeLanguage("en");
		vi.spyOn(makeApiRequest.condominiums, "list").mockResolvedValue({
			data: [],
		} as any);
	});

	const renderComponent = () =>
		render(
			<Provider>
				<CondominiumProvider>
					<BrowserRouter>
						<SettingsPage />
					</BrowserRouter>
				</CondominiumProvider>
			</Provider>,
		);

	it("renders current administrator details in input fields", async () => {
		renderComponent();

		expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
		expect(screen.getByDisplayValue("Lovelace")).toBeInTheDocument();
		expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
	});

	it("updates profile when name and surname are edited and saved", async () => {
		const user = userEvent.setup();
		renderComponent();

		mockUpdateProfile.mockResolvedValue({
			...mockUser,
			firstName: "AdaUpdated",
			lastName: "Byron",
		});

		const nameInput = screen.getByDisplayValue("Ada");
		await user.clear(nameInput);
		await user.type(nameInput, "AdaUpdated");

		const surnameInput = screen.getByDisplayValue("Lovelace");
		await user.clear(surnameInput);
		await user.type(surnameInput, "Byron");

		const saveButton = screen.getByRole("button", { name: /save changes/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockUpdateProfile).toHaveBeenCalledWith({
				firstName: "AdaUpdated",
				lastName: "Byron",
			});
		});

		expect(toaster.create).toHaveBeenCalledWith({
			title: "Profile updated successfully.",
			type: "success",
		});
	});

	it("requires current password when new password is set", async () => {
		const user = userEvent.setup();
		renderComponent();

		const newPasswordInput = screen.getByPlaceholderText("New password");
		await user.type(newPasswordInput, "newPassword123!");

		const saveButton = screen.getByRole("button", { name: /save changes/i });
		await user.click(saveButton);

		expect(mockUpdateProfile).not.toHaveBeenCalled();
		expect(toaster.create).toHaveBeenCalledWith({
			title: "Current password is required to set a new password.",
			type: "error",
		});
	});

	it("submits password update when current and new passwords are provided", async () => {
		const user = userEvent.setup();
		renderComponent();

		mockUpdateProfile.mockResolvedValue(mockUser);

		const currentPasswordInput = screen.getByPlaceholderText("Current password");
		const newPasswordInput = screen.getByPlaceholderText("New password");

		await user.type(currentPasswordInput, "oldPassword123!");
		await user.type(newPasswordInput, "newPassword123!");

		const saveButton = screen.getByRole("button", { name: /save changes/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockUpdateProfile).toHaveBeenCalledWith({
				currentPassword: "oldPassword123!",
				newPassword: "newPassword123!",
			});
		});
	});
});
