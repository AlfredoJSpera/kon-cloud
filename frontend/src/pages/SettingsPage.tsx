import {
	Box,
	Button,
	Heading,
	HStack,
	Input,
	Separator,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/chakraui/avatar";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { toaster } from "@/components/chakraui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import type { IAdministratorUpdateInput } from "@backend-interfaces/administrator";

export function SettingsPage() {
	const { t } = useTranslation();
	const { user, updateProfile } = useAuth();
	const navigate = useNavigate();

	const fullName = user
		? `${user.firstName} ${user.lastName}`
		: t("settings.administrator");
	const [firstName, setFirstName] = useState(user?.firstName ?? "");
	const [lastName, setLastName] = useState(user?.lastName ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [newEmail, setNewEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (user) {
			setFirstName(user.firstName);
			setLastName(user.lastName);
			setEmail(user.email);
		}
	}, [user]);

	const handleSave = async () => {
		const targetEmail = newEmail.trim() || email.trim();

		if (newPassword.trim() && !currentPassword.trim()) {
			toaster.create({
				title: t("settings.currentPasswordRequired"),
				type: "error",
			});
			return;
		}

		const payload: IAdministratorUpdateInput = {};
		if (firstName.trim() !== user?.firstName) payload.firstName = firstName.trim();
		if (lastName.trim() !== user?.lastName) payload.lastName = lastName.trim();
		if (targetEmail !== user?.email) payload.email = targetEmail;
		if (currentPassword.trim()) payload.currentPassword = currentPassword.trim();
		if (newPassword.trim()) payload.newPassword = newPassword.trim();

		if (Object.keys(payload).length === 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			await updateProfile(payload);
			toaster.create({
				title: t("settings.updatedSuccess"),
				type: "success",
			});
			setNewEmail("");
			setCurrentPassword("");
			setNewPassword("");
		} catch {
			// Error toast handled by AuthProvider
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle=""
			contentHeaderSubtitle={t("settings.contentHeaderSubtitle")}
			contentHeaderTitle={t("settings.contentHeaderTitle")}
		>
			<SimpleGrid columns={{ base: 1, xl: 3 }} gap="6">
				<Box
					borderWidth="1px"
					p="6"
					gridColumn={{ base: "auto", xl: "span 1" }}
				>
					<Stack gap="4" align="center" textAlign="center">
						<Avatar name={fullName} size="2xl" />
						<Box>
							<Heading size="lg">{fullName}</Heading>
							<Text>{t("settings.administrator")}</Text>
						</Box>
						<Text fontSize="sm">
							{t("settings.uploadDescription")}
						</Text>
						<Button variant="outline" width="full">
							{t("settings.uploadPicture")}
						</Button>
					</Stack>
				</Box>

				<Box
					borderWidth="1px"
					p="6"
					gridColumn={{ base: "auto", xl: "span 2" }}
				>
					<Stack gap="6">
						<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
							<Field label={t("settings.nameLabel")}>
								<Input
									placeholder="Alex"
									value={firstName}
									onChange={(e) =>
										setFirstName(e.target.value)
									}
								/>
							</Field>
							<Field label={t("settings.surnameLabel")}>
								<Input
									placeholder="Morgan"
									value={lastName}
									onChange={(e) =>
										setLastName(e.target.value)
									}
								/>
							</Field>
							<Field label={t("settings.emailLabel")}>
								<Input
									value={email}
									onChange={(event) =>
										setEmail(event.target.value)
									}
								/>
							</Field>
							<Field label={t("settings.newEmailLabel")}>
								<Input
									placeholder={t("settings.newEmailPlaceholder")}
									value={newEmail}
									onChange={(event) =>
										setNewEmail(event.target.value)
									}
								/>
							</Field>
						</SimpleGrid>

						<Separator />

						<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
							<Field label={t("settings.passwordLabel")}>
								<PasswordInput
									placeholder={t("settings.currentPasswordPlaceholder")}
									value={currentPassword}
									onChange={(e) =>
										setCurrentPassword(e.target.value)
									}
								/>
							</Field>
							<Field label={t("settings.newPasswordLabel")}>
								<PasswordInput
									placeholder={t("settings.newPasswordPlaceholder")}
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
								/>
							</Field>
						</SimpleGrid>

						<HStack justify="flex-end" gap="3">
							<Button
								variant="outline"
								onClick={() => navigate("/")}
							>
								{t("settings.cancel")}
							</Button>
							<Button
								loading={isSubmitting}
								onClick={handleSave}
							>
								{t("settings.saveChanges")}
							</Button>
						</HStack>
					</Stack>
				</Box>
			</SimpleGrid>
		</DashboardContainer>
	);
}

