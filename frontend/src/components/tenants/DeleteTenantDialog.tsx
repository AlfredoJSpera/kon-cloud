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
import type { ITenantOutput } from "@backend-interfaces/tenant";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";

interface DeleteTenantDialogProps {
	open: boolean;
	onClose: () => void;
	tenant: ITenantOutput | null;
	onSuccess: () => void;
}

export function DeleteTenantDialog({
	open,
	onClose,
	tenant,
	onSuccess,
}: DeleteTenantDialogProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!tenant) return;
		setLoading(true);
		try {
			await makeApiRequest.tenants.delete(tenant.tenantId);
			toaster.create({
				title: t("tenants.deletedSuccess"),
				type: "success",
			});
			onSuccess();
			onClose();
		} catch (error: unknown) {
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: "Failed to delete tenant",
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
					<DialogTitle>{t("tenants.deleteTitle")}</DialogTitle>
				</DialogHeader>
				<DialogCloseTrigger />

				<DialogBody>
					<Text mb="2">
						{t("tenants.deleteConfirmation", {
							name: tenant
								? `${tenant.firstName} ${tenant.lastName}`
								: "",
						})}
					</Text>
					<Text fontSize="sm" color="gray.500">
						{t("tenants.deleteSubtext")}
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
						data-testid="confirm-delete-tenant-btn"
					>
						{t("condominiums.yes")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</DialogRoot>
	);
}
