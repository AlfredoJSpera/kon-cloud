import { Button, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	DialogBody,
	DialogCloseTrigger,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogRoot,
	DialogTitle,
} from "@/components/chakraui/dialog";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";
import { useCondominium } from "@/hooks/useCondominium";
import { toaster } from "@/components/chakraui/toaster";

interface DeleteCondominiumDialogProps {
	open: boolean;
	onClose: () => void;
	condominium: ICondominiumOutput | null;
}

export function DeleteCondominiumDialog({
	open,
	onClose,
	condominium,
}: DeleteCondominiumDialogProps) {
	const { t } = useTranslation();
	const { deleteCondominium } = useCondominium();
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!condominium) return;
		setLoading(true);
		try {
			await deleteCondominium(condominium.condominiumId);
			toaster.create({
				title: t("condominiums.deletedSuccess"),
				type: "success",
			});
			onClose();
		} catch (error: unknown) {
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: "Failed to delete condominium",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<DialogRoot
			open={open}
			onOpenChange={(e) => {
				if (!e.open) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("condominiums.deleteTitle")}</DialogTitle>
				</DialogHeader>
				<DialogCloseTrigger />

				<DialogBody>
					<Text>
						{t("condominiums.deleteConfirmation", {
							name: condominium?.name || "",
						})}
					</Text>
				</DialogBody>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} type="button">
						{t("condominiums.no")}
					</Button>
					<Button
						colorScheme="red"
						colorPalette="red"
						loading={loading}
						onClick={handleDelete}
						data-testid="confirm-delete-btn"
					>
						{t("condominiums.yes")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
