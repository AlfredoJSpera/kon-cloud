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
import type { ITenantOutput } from "@backend-interfaces/tenant";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import axios from "axios";

interface TenantModalProps {
	open: boolean;
	onClose: () => void;
	condominiumId: number;
	editingTenant: ITenantOutput | null;
	onSuccess: () => void;
}

export function TenantModal({
	open,
	onClose,
	condominiumId,
	editingTenant,
	onSuccess,
}: TenantModalProps) {
	const { t } = useTranslation();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [apartmentNumber, setApartmentNumber] = useState("");

	const [loading, setLoading] = useState(false);
	const [firstNameError, setFirstNameError] = useState("");
	const [lastNameError, setLastNameError] = useState("");
	const [apartmentError, setApartmentError] = useState("");
	const [contactError, setContactError] = useState("");
	const [generalError, setGeneralError] = useState("");

	const [prevEditing, setPrevEditing] = useState<ITenantOutput | null>(null);
	const [prevOpen, setPrevOpen] = useState(false);

	if (editingTenant !== prevEditing || open !== prevOpen) {
		setPrevEditing(editingTenant);
		setPrevOpen(open);
		setFirstName(editingTenant?.firstName || "");
		setLastName(editingTenant?.lastName || "");
		setEmail(editingTenant?.email || "");
		setPhone(editingTenant?.phone || "");
		setApartmentNumber(editingTenant?.apartmentNumber || "");

		setFirstNameError("");
		setLastNameError("");
		setApartmentError("");
		setContactError("");
		setGeneralError("");
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFirstNameError("");
		setLastNameError("");
		setApartmentError("");
		setContactError("");
		setGeneralError("");

		let hasError = false;

		if (!firstName.trim()) {
			setFirstNameError(t("register.fieldRequired"));
			hasError = true;
		}

		if (!lastName.trim()) {
			setLastNameError(t("register.fieldRequired"));
			hasError = true;
		}

		if (!apartmentNumber.trim()) {
			setApartmentError(t("register.fieldRequired"));
			hasError = true;
		}

		if (!email.trim() && !phone.trim()) {
			setContactError(t("tenants.contactRequired"));
			hasError = true;
		}

		if (hasError) return;

		setLoading(true);

		try {
			if (editingTenant) {
				await makeApiRequest.tenants.update(editingTenant.tenantId, {
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
					apartmentNumber: apartmentNumber.trim(),
				});
				toaster.create({
					title: t("tenants.updatedSuccess"),
					type: "success",
				});
			} else {
				await makeApiRequest.tenants.create({
					condominiumId,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
					apartmentNumber: apartmentNumber.trim(),
				});
				toaster.create({
					title: t("tenants.createdSuccess"),
					type: "success",
				});
			}

			onSuccess();
			onClose();
		} catch (err: unknown) {
			if (axios.isAxiosError(err) && err.response) {
				const errorCode = err.response.data?.errorCode;
				if (errorCode === "TENANT_ALREADY_EXISTS") {
					setGeneralError(t("tenants.duplicateError"));
					toaster.create({
						title: t("tenants.validationErrorTitle"),
						description: t("tenants.duplicateError"),
						type: "error",
					});
				} else {
					setGeneralError(
						err.response.data?.message || "Operation failed",
					);
					toaster.create({
						title: t("dashboard.errorTitle"),
						description: err.response.data?.message || "Operation failed",
						type: "error",
					});
				}
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
							{editingTenant
								? t("tenants.editTitle")
								: t("tenants.addTitle")}
						</DialogTitle>
					</DialogHeader>
					<DialogCloseTrigger />

					<DialogBody>
						<Stack gap="4">
							{generalError && (
								<Field invalid errorText={generalError} />
							)}

							<Field
								label={t("tenants.firstName")}
								required
								invalid={!!firstNameError}
								errorText={firstNameError}
							>
								<Input
									value={firstName}
									onChange={(e) => {
										setFirstName(e.target.value);
										if (firstNameError) setFirstNameError("");
									}}
									placeholder={t("tenants.firstName")}
									data-testid="tenant-first-name-input"
								/>
							</Field>

							<Field
								label={t("tenants.lastName")}
								required
								invalid={!!lastNameError}
								errorText={lastNameError}
							>
								<Input
									value={lastName}
									onChange={(e) => {
										setLastName(e.target.value);
										if (lastNameError) setLastNameError("");
									}}
									placeholder={t("tenants.lastName")}
									data-testid="tenant-last-name-input"
								/>
							</Field>

							<Field
								label={t("tenants.apartmentNumber")}
								required
								invalid={!!apartmentError}
								errorText={apartmentError}
							>
								<Input
									value={apartmentNumber}
									onChange={(e) => {
										setApartmentNumber(e.target.value);
										if (apartmentError) setApartmentError("");
									}}
									placeholder={t("tenants.apartmentPlaceholder")}
									data-testid="tenant-apartment-input"
								/>
							</Field>

							<Field
								label={t("tenants.email")}
								invalid={!!contactError}
								errorText={contactError}
							>
								<Input
									type="email"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (contactError) setContactError("");
									}}
									placeholder="email@example.com"
									data-testid="tenant-email-input"
								/>
							</Field>

							<Field
								label={t("tenants.phone")}
								invalid={!!contactError}
								errorText={contactError}
							>
								<Input
									value={phone}
									onChange={(e) => {
										setPhone(e.target.value);
										if (contactError) setContactError("");
									}}
									placeholder="+39 333 1234567"
									data-testid="tenant-phone-input"
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
							{t("tenants.cancel")}
						</Button>
						<Button
							loading={loading}
							type="submit"
							data-testid="tenant-submit-btn"
						>
							{t("tenants.save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</DialogRoot>
	);
}
