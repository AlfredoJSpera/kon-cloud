import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionMenu } from "../ActionMenu";
import { Provider } from "@/components/chakraui/provider";
import i18n from "@/i18n/config";

describe("ActionMenu Component", () => {
	it("renders trigger button and opens edit/delete options when clicked", async () => {
		await i18n.changeLanguage("en");
		const handleEdit = vi.fn();
		const handleDelete = vi.fn();

		render(
			<Provider>
				<ActionMenu
					onEdit={handleEdit}
					onDelete={handleDelete}
					triggerTestId="test-trigger"
					editTestId="test-edit"
					deleteTestId="test-delete"
				/>
			</Provider>,
		);

		const triggerBtn = screen.getByTestId("test-trigger");
		expect(triggerBtn).toBeInTheDocument();

		fireEvent.click(triggerBtn);

		const editBtn = await screen.findByTestId("test-edit");
		const deleteBtn = await screen.findByTestId("test-delete");

		expect(editBtn).toBeInTheDocument();
		expect(deleteBtn).toBeInTheDocument();

		fireEvent.click(editBtn);
		expect(handleEdit).toHaveBeenCalledTimes(1);
	});
});
