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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/chakraui/avatar";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const navigate = useNavigate();

	const fullName = user
		? `${user.firstName} ${user.lastName}`
		: t("settings.administrator");
	const [firstName, setFirstName] = useState(user?.firstName ?? "");
	const [lastName, setLastName] = useState(user?.lastName ?? "");
	const [email, setEmail] = useState(user?.email ?? "");

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
								<Input placeholder={t("settings.newEmailPlaceholder")} />
							</Field>
						</SimpleGrid>

						<Separator />

						<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
							<Field label={t("settings.passwordLabel")}>
								<PasswordInput placeholder={t("settings.currentPasswordPlaceholder")} />
							</Field>
							<Field label={t("settings.newPasswordLabel")}>
								<PasswordInput placeholder={t("settings.newPasswordPlaceholder")} />
							</Field>
						</SimpleGrid>

						<HStack justify="flex-end" gap="3">
							<Button
								variant="outline"
								onClick={() => navigate("/")}
							>
								{t("settings.cancel")}
							</Button>
							<Button>{t("settings.saveChanges")}</Button>
						</HStack>
					</Stack>
				</Box>
			</SimpleGrid>
		</DashboardContainer>
	);
}

