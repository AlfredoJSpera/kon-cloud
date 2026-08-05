import {
	Badge,
	Box,
	Button,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	Separator,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
	LuArrowRight,
	LuChartBar,
	LuBookOpen,
	LuFolderKanban,
	LuShieldCheck,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useAuth } from "@/hooks/useAuth";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import { isAxiosError } from "axios";
import getApiErrorMessage from "@/api/apiErrorMessages";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
	const { t } = useTranslation();
	const { user } = useAuth();

	const cards = useMemo(
		() => [
			{ title: t("dashboard.projectFiles"), value: "24", icon: LuFolderKanban },
			{ title: t("dashboard.activeSessions"), value: "12", icon: LuChartBar },
			{ title: t("dashboard.sharedNotes"), value: "8", icon: LuBookOpen },
			{ title: t("dashboard.securityChecks"), value: "99%", icon: LuShieldCheck },
		],
		[t],
	);

	const quickActions = useMemo(
		() => [
			t("dashboard.actionOpenSettings"),
			t("dashboard.actionReviewLogin"),
			t("dashboard.actionSwitchRegister"),
		],
		[t],
	);

	const handleMe = async () => {
		try {
			const res = await makeApiRequest.administrators.me();
			toaster.create({
				title: t("dashboard.requestCompleted"),
				description: `${res.data.firstName} ${res.data.lastName}`,
				type: "success",
				closable: true,
			});
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				toaster.create({
					title: t("dashboard.errorTitle"),
					description: getApiErrorMessage(
						error.response?.data.errorCode || "",
					),
					type: "error",
					closable: true,
				});
			}
		}
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle="My Extra Long Condominium Name"
			contentHeaderSubtitle="Dashboard preview"
			contentHeaderTitle={
				user
					? t("dashboard.welcome", { name: user.firstName })
					: t("dashboard.pageLayout")
			}
		>
			<Stack gap="6">
				<Box borderWidth="1px" p={{ base: "4", md: "6" }}>
					<Flex
						justify="space-between"
						align="center"
						gap="4"
						wrap="wrap"
					>
						<Box>
							<Text fontSize="sm">{t("dashboard.overviewSettings")}</Text>
							<Heading size="lg" mt="1">
								{t("dashboard.responsiveLayout")}
							</Heading>
						</Box>
						<Button onClick={() => handleMe()}>
							{t("dashboard.openDashboard")}
						</Button>
					</Flex>

					<SimpleGrid
						columns={{ base: 1, md: 2, xl: 4 }}
						gap="4"
						mt="6"
					>
						{cards.map((card) => (
							<Box key={card.title} borderWidth="1px" p="4">
								<HStack justify="space-between" align="start">
									<Stack gap="1">
										<Text fontSize="sm">{card.title}</Text>
										<Heading size="xl">
											{card.value}
										</Heading>
									</Stack>
									<Box p="1">
										<Icon as={card.icon} />
									</Box>
								</HStack>
								<Separator my="4" />
								<Text fontSize="sm">
									{t("dashboard.placeholderTiles")}
								</Text>
							</Box>
						))}
					</SimpleGrid>
				</Box>

				<SimpleGrid columns={{ base: 1, xl: 2 }} gap="6">
					<Box borderWidth="1px" p="6">
						<Flex justify="space-between" align="center" mb="4">
							<Box>
								<Text fontSize="sm">{t("dashboard.primaryArea")}</Text>
								<Heading size="md">{t("dashboard.contentGrid")}</Heading>
							</Box>
							<Badge variant="subtle">{t("dashboard.liveBadge")}</Badge>
						</Flex>
						<Grid
							templateColumns="repeat(2, minmax(0, 1fr))"
							gap="4"
						>
							{Array.from({ length: 8 }).map((_, index) => (
								<Box key={index} borderWidth="1px" h="24" />
							))}
						</Grid>
					</Box>

					<Box borderWidth="1px" p="6">
						<Heading size="md" mb="4">
							{t("dashboard.quickActions")}
						</Heading>
						<Stack gap="3">
							{quickActions.map((label) => (
								<Button
									key={label}
									variant="outline"
									justifyContent="space-between"
									onClick={() => undefined}
								>
									<Text>{label}</Text>
									<LuArrowRight />
								</Button>
							))}
						</Stack>
					</Box>
				</SimpleGrid>
			</Stack>
		</DashboardContainer>
	);
}

