import { Button, Input, Stack } from "@chakra-ui/react";
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
import { Field } from "@/components/chakraui/field";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";
import { useCondominium } from "@/hooks/useCondominium";
import { toaster } from "@/components/chakraui/toaster";

interface CondominiumModalProps {
	open: boolean;
	onClose: () => void;
	editingCondominium: ICondominiumOutput | null;
}

export function CondominiumModal({
	open,
	onClose,
	editingCondominium,
}: CondominiumModalProps) {
	const { t } = useTranslation();
	const { createCondominium, updateCondominium } = useCondominium();
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [loading, setLoading] = useState(false);
	const [nameError, setNameError] = useState("");

	const [prevEditing, setPrevEditing] = useState<ICondominiumOutput | null>(
		null,
	);
	const [prevOpen, setPrevOpen] = useState(false);

	if (editingCondominium !== prevEditing || open !== prevOpen) {
		setPrevEditing(editingCondominium);
		setPrevOpen(open);
		setName(editingCondominium?.name || "");
		setAddress(editingCondominium?.address || "");
		setNameError("");
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setNameError(t("register.fieldRequired"));
			return;
		}

		setLoading(true);
		try {
			if (editingCondominium) {
				await updateCondominium(editingCondominium.condominiumId, {
					name: name.trim(),
					address: address.trim() || undefined,
				});
				toaster.create({
					title: t("condominiums.updatedSuccess"),
					type: "success",
				});
			} else {
				await createCondominium({
					name: name.trim(),
					address: address.trim() || undefined,
				});
				toaster.create({
					title: t("condominiums.createdSuccess"),
					type: "success",
				});
			}
			onClose();
		} catch (error: unknown) {
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: "Operation failed",
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
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("condominiums.addEdit")}</DialogTitle>
					</DialogHeader>
					<DialogCloseTrigger />

					<DialogBody>
						<Stack gap="4">
							<Field
								label={t("condominiums.name")}
								required
								invalid={!!nameError}
								errorText={nameError}
							>
								<Input
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										if (nameError) setNameError("");
									}}
									placeholder={t("condominiums.name")}
									data-testid="condominium-name-input"
								/>
							</Field>

							<Field label={t("condominiums.location")}>
								<Input
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder={t("condominiums.location")}
									data-testid="condominium-location-input"
								/>
							</Field>
						</Stack>
					</DialogBody>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={onClose}
							type="button"
						>
							{t("condominiums.cancel")}
						</Button>
						<Button
							loading={loading}
							type="submit"
							data-testid="condominium-submit-btn"
						>
							{t("condominiums.addEdit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</DialogRoot>
	);
}
