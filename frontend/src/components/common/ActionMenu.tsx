import { HStack, IconButton, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuEllipsisVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "@/components/chakraui/menu";

export interface ActionMenuProps {
	onEdit?: () => void;
	onDelete?: () => void;
	editLabel?: string;
	deleteLabel?: string;
	triggerTestId?: string;
	editTestId?: string;
	deleteTestId?: string;
	size?: "xs" | "sm" | "md" | "lg";
}

export function ActionMenu({
	onEdit,
	onDelete,
	editLabel,
	deleteLabel,
	triggerTestId,
	editTestId,
	deleteTestId,
	size = "sm",
}: ActionMenuProps) {
	const { t } = useTranslation();

	const resolvedEditLabel = editLabel || t("condominiums.edit");
	const resolvedDeleteLabel = deleteLabel || t("condominiums.delete");

	return (
		<MenuRoot>
			<MenuTrigger asChild>
				<IconButton
					aria-label="Actions"
					variant="ghost"
					size={size}
					data-testid={triggerTestId}
				>
					<LuEllipsisVertical />
				</IconButton>
			</MenuTrigger>
			<MenuContent>
				{onEdit && (
					<MenuItem
						value="edit"
						onClick={onEdit}
						data-testid={editTestId}
					>
						<HStack gap="2">
							<LuPencil />
							<Text>{resolvedEditLabel}</Text>
						</HStack>
					</MenuItem>
				)}
				{onDelete && (
					<MenuItem
						value="delete"
						color="red.500"
						onClick={onDelete}
						data-testid={deleteTestId}
					>
						<HStack gap="2" color="red.500">
							<LuTrash2 />
							<Text color="red.500">{resolvedDeleteLabel}</Text>
						</HStack>
					</MenuItem>
				)}
			</MenuContent>
		</MenuRoot>
	);
}
