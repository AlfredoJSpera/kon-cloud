import {
	Button,
	createListCollection,
	Input,
	Select,
	Stack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
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
import type { ITenantOutput } from "@backend-interfaces/tenant";
import type { IDueOutput } from "@backend-interfaces/due";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import axios from "axios";

interface DueModalProps {
	open: boolean;
	onClose: () => void;
	tenants: ITenantOutput[];
	defaultTenantId?: number;
	editingDue?: IDueOutput | null;
	onSuccess: () => void;
}

export function DueModal({
	open,
	onClose,
	tenants,
	defaultTenantId,
	editingDue,
	onSuccess,
}: DueModalProps) {
	const { t } = useTranslation();
	const [tenantId, setTenantId] = useState<string>(
		editingDue
			? String(editingDue.tenantId)
			: defaultTenantId
				? String(defaultTenantId)
				: "",
	);
	const [amount, setAmount] = useState<string>(
		editingDue ? String(editingDue.amount) : "",
	);
	const [reason, setReason] = useState<string>(
		editingDue ? editingDue.reason : "",
	);

	const modalTenantCollection = useMemo(() => {
		return createListCollection({
			items: tenants.map((tenant) => ({
				label: `${tenant.firstName} ${tenant.lastName} (${tenant.apartmentNumber})`,
				value: String(tenant.tenantId),
			})),
		});
	}, [tenants]);

	const [loading, setLoading] = useState(false);
	const [tenantError, setTenantError] = useState("");
	const [amountError, setAmountError] = useState("");
	const [reasonError, setReasonError] = useState("");
	const [generalError, setGeneralError] = useState("");

	const [prevOpen, setPrevOpen] = useState(false);
	const [prevDefaultTenant, setPrevDefaultTenant] = useState<
		number | undefined
	>(defaultTenantId);
	const [prevEditingDue, setPrevEditingDue] = useState<
		IDueOutput | null | undefined
	>(editingDue);

	if (
		open !== prevOpen ||
		defaultTenantId !== prevDefaultTenant ||
		editingDue !== prevEditingDue
	) {
		setPrevOpen(open);
		setPrevDefaultTenant(defaultTenantId);
		setPrevEditingDue(editingDue);
		if (editingDue) {
			setTenantId(String(editingDue.tenantId));
			setAmount(String(editingDue.amount));
			setReason(editingDue.reason);
		} else {
			setTenantId(
				defaultTenantId
					? String(defaultTenantId)
					: tenants.length > 0
						? String(tenants[0].tenantId)
						: "",
			);
			setAmount("");
			setReason("");
		}
		setTenantError("");
		setAmountError("");
		setReasonError("");
		setGeneralError("");
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTenantError("");
		setAmountError("");
		setReasonError("");
		setGeneralError("");

		let hasError = false;

		const parsedTenantId = parseInt(tenantId, 10);
		if (!editingDue && (!tenantId || isNaN(parsedTenantId))) {
			setTenantError(t("register.fieldRequired"));
			hasError = true;
		}

		const parsedAmount = parseFloat(amount);
		if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
			setAmountError(t("register.fieldRequired"));
			hasError = true;
		}

		if (!reason.trim()) {
			setReasonError(t("register.fieldRequired"));
			hasError = true;
		}

		if (hasError) return;

		setLoading(true);

		try {
			// Enforce fixed 2 decimal places precision for monetary amounts
			const fixedPrecisionAmount = Number(parsedAmount.toFixed(2));

			if (editingDue) {
				await makeApiRequest.dues.update(editingDue.dueId, {
					amount: fixedPrecisionAmount,
					reason: reason.trim(),
				});
				toaster.create({
					title: t("dues.dueUpdatedSuccess"),
					type: "success",
				});
			} else {
				await makeApiRequest.dues.create({
					tenantId: parsedTenantId,
					amount: fixedPrecisionAmount,
					reason: reason.trim(),
				});
				toaster.create({
					title: t("dues.dueCreatedSuccess"),
					type: "success",
				});
			}

			onSuccess();
			onClose();
		} catch (err: unknown) {
			if (axios.isAxiosError(err) && err.response) {
				setGeneralError(
					err.response.data?.message || "Failed to save due amount",
				);
				toaster.create({
					title: t("dashboard.errorTitle"),
					description:
						err.response.data?.message || "Failed to save due amount",
					type: "error",
				});
			} else {
				setGeneralError("Operation failed");
				toaster.create({
					title: t("dashboard.errorTitle"),
					description: "Operation failed",
					type: "error",
				});
			}
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
						<DialogTitle>
							{editingDue ? t("dues.editDueTitle") : t("dues.dueTitle")}
						</DialogTitle>
					</DialogHeader>
					<DialogCloseTrigger />

					<DialogBody>
						<Stack gap="4">
							{generalError && (
								<Field invalid errorText={generalError} />
							)}

							{!editingDue && (
								<Field
									label={t("dues.tenant")}
									required
									invalid={!!tenantError}
									errorText={tenantError}
								>
									<Select.Root
										collection={modalTenantCollection}
										size="sm"
										value={tenantId ? [tenantId] : []}
										onValueChange={(e) => {
											const val = e.value[0] ?? "";
											setTenantId(val);
											if (tenantError) setTenantError("");
										}}
										data-testid="due-tenant-select"
									>
										<Select.HiddenSelect />
										<Select.Control>
											<Select.Trigger>
												<Select.ValueText
													placeholder={t(
														"dues.selectTenant",
													)}
												/>
											</Select.Trigger>
											<Select.IndicatorGroup>
												<Select.Indicator />
											</Select.IndicatorGroup>
										</Select.Control>
										<Select.Positioner>
											<Select.Content>
												{modalTenantCollection.items.map(
													(item) => (
														<Select.Item
															item={item}
															key={item.value}
														>
															{item.label}
															<Select.ItemIndicator />
														</Select.Item>
													),
												)}
											</Select.Content>
										</Select.Positioner>
									</Select.Root>
								</Field>
							)}

							<Field
								label={t("dues.amount")}
								required
								invalid={!!amountError}
								errorText={amountError}
							>
								<Input
									type="number"
									step="0.01"
									min="0.01"
									value={amount}
									onChange={(e) => {
										setAmount(e.target.value);
										if (amountError) setAmountError("");
									}}
									placeholder="0.00"
									data-testid="due-amount-input"
								/>
							</Field>

							<Field
								label={t("dues.reason")}
								required
								invalid={!!reasonError}
								errorText={reasonError}
							>
								<Input
									value={reason}
									onChange={(e) => {
										setReason(e.target.value);
										if (reasonError) setReasonError("");
									}}
									placeholder={t("dues.reasonPlaceholder")}
									data-testid="due-reason-input"
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
							{t("dues.cancel")}
						</Button>
						<Button
							loading={loading}
							type="submit"
							data-testid="due-submit-btn"
						>
							{editingDue ? t("dues.edit") : t("dues.saveDue")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</DialogRoot>
	);
}
