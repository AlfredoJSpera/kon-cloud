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
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import axios from "axios";

interface PaymentModalProps {
	open: boolean;
	onClose: () => void;
	tenants: ITenantOutput[];
	defaultTenantId?: number;
	onSuccess: () => void;
}

export function PaymentModal({
	open,
	onClose,
	tenants,
	defaultTenantId,
	onSuccess,
}: PaymentModalProps) {
	const { t } = useTranslation();
	const todayDate = new Date().toISOString().split("T")[0];

	const [tenantId, setTenantId] = useState<string>(
		defaultTenantId ? String(defaultTenantId) : "",
	);
	const [amount, setAmount] = useState<string>("");
	const [paymentDate, setPaymentDate] = useState<string>(todayDate);
	const [notes, setNotes] = useState<string>("");

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
	const [dateError, setDateError] = useState("");
	const [generalError, setGeneralError] = useState("");

	const [prevOpen, setPrevOpen] = useState(false);
	const [prevDefaultTenant, setPrevDefaultTenant] = useState<
		number | undefined
	>(defaultTenantId);

	if (open !== prevOpen || defaultTenantId !== prevDefaultTenant) {
		setPrevOpen(open);
		setPrevDefaultTenant(defaultTenantId);
		setTenantId(
			defaultTenantId
				? String(defaultTenantId)
				: tenants.length > 0
					? String(tenants[0].tenantId)
					: "",
		);
		setAmount("");
		setPaymentDate(todayDate);
		setNotes("");
		setTenantError("");
		setAmountError("");
		setDateError("");
		setGeneralError("");
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTenantError("");
		setAmountError("");
		setDateError("");
		setGeneralError("");

		let hasError = false;

		const parsedTenantId = parseInt(tenantId, 10);
		if (!tenantId || isNaN(parsedTenantId)) {
			setTenantError(t("register.fieldRequired"));
			hasError = true;
		}

		const parsedAmount = parseFloat(amount);
		if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
			setAmountError(t("register.fieldRequired"));
			hasError = true;
		}

		if (!paymentDate) {
			setDateError(t("register.fieldRequired"));
			hasError = true;
		}

		if (hasError) return;

		setLoading(true);

		try {
			const fixedPrecisionAmount = Number(parsedAmount.toFixed(2));

			await makeApiRequest.payments.create({
				tenantId: parsedTenantId,
				amount: fixedPrecisionAmount,
				paymentDate: new Date(paymentDate).toISOString(),
				notes: notes.trim() || undefined,
			});

			toaster.create({
				title: t("dues.paymentCreatedSuccess"),
				type: "success",
			});

			onSuccess();
			onClose();
		} catch (err: unknown) {
			if (axios.isAxiosError(err) && err.response) {
				setGeneralError(
					err.response.data?.message || "Failed to record payment",
				);
				toaster.create({
					title: t("dashboard.errorTitle"),
					description:
						err.response.data?.message || "Failed to record payment",
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
						<DialogTitle>{t("dues.paymentTitle")}</DialogTitle>
					</DialogHeader>
					<DialogCloseTrigger />

					<DialogBody>
						<Stack gap="4">
							{generalError && (
								<Field invalid errorText={generalError} />
							)}

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
									data-testid="payment-tenant-select"
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
									data-testid="payment-amount-input"
								/>
							</Field>

							<Field
								label={t("dues.paymentDate")}
								required
								invalid={!!dateError}
								errorText={dateError}
							>
								<Input
									type="date"
									value={paymentDate}
									onChange={(e) => {
										setPaymentDate(e.target.value);
										if (dateError) setDateError("");
									}}
									data-testid="payment-date-input"
								/>
							</Field>

							<Field label={t("dues.notes")}>
								<Input
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder={t("dues.notesPlaceholder")}
									data-testid="payment-notes-input"
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
							data-testid="payment-submit-btn"
						>
							{t("dues.savePayment")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</DialogRoot>
	);
}
