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
	LuBuilding,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useCondominium } from "@/hooks/useCondominium";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
	const { t } = useTranslation();
	const { selectedCondominium } = useCondominium();
	const navigate = useNavigate();

	const cards = useMemo(
		() => [
			{
				title: t("dashboard.projectFiles"),
				value: "24",
				icon: LuFolderKanban,
			},
			{
				title: t("dashboard.activeSessions"),
				value: "12",
				icon: LuChartBar,
			},
			{ title: t("dashboard.sharedNotes"), value: "8", icon: LuBookOpen },
			{
				title: t("dashboard.securityChecks"),
				value: "99%",
				icon: LuShieldCheck,
			},
		],
		[t],
	);

	const quickActions = useMemo(
		() => [
			{ label: t("dashboard.actionOpenSettings"), path: "/settings" },
			{ label: t("condominiums.title"), path: "/condominiums" },
		],
		[t],
	);

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle={
				selectedCondominium?.name || t("condominiums.selectCondominium")
			}
			contentHeaderSubtitle={
				selectedCondominium
					? selectedCondominium.address ||
						t("dashboard.overviewSettings")
					: t("dashboard.overviewSettings")
			}
			contentHeaderTitle="Dashboard"
		>
			{!selectedCondominium ? (
				/* Case 1: No Condominium Selected */
				<Flex
					direction="column"
					align="center"
					justify="center"
					minH="50vh"
					borderWidth="1px"
					borderRadius="lg"
					p={{ base: "6", md: "12" }}
					textAlign="center"
					data-testid="no-condo-selected-container"
				>
					<Icon
						as={LuBuilding}
						boxSize="12"
						color="gray.400"
						mb="4"
					/>
					<Heading size="xl" mb="2">
						{t("dashboard.noCondominiumSelected")}
					</Heading>
					<Text color="gray.500" mb="6" maxW="md">
						{t("dashboard.selectOrCreateFromCondominiumsPage")}
					</Text>
					<Button
						colorPalette="blue"
						onClick={() => navigate("/condominiums")}
						data-testid="goto-condominiums-btn"
					>
						<HStack gap="2">
							<Text>{t("condominiums.title")}</Text>
							<LuArrowRight />
						</HStack>
					</Button>
				</Flex>
			) : (
				/* Case 2: Condominium Selected, sample elements */
				<Stack gap="6" data-testid="condo-selected-container">
					<Box borderWidth="1px" p={{ base: "4", md: "6" }}>
						<Flex
							justify="space-between"
							align="center"
							gap="4"
							wrap="wrap"
						>
							<Box>
								<Text
									fontSize="sm"
									color="blue.600"
									fontWeight="semibold"
								>
									{selectedCondominium.name}
								</Text>
								<Heading size="lg" mt="1">
									{t(
										"dashboard.condominiumDataVisualization",
									)}
								</Heading>
							</Box>
							<Badge colorPalette="green" size="lg">
								{t("condominiums.active")}
							</Badge>
						</Flex>

						<SimpleGrid
							columns={{ base: 1, md: 2, xl: 4 }}
							gap="4"
							mt="6"
						>
							{cards.map((card) => (
								<Box key={card.title} borderWidth="1px" p="4">
									<HStack
										justify="space-between"
										align="start"
									>
										<Stack gap="1">
											<Text fontSize="sm">
												{card.title}
											</Text>
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
									<Text fontSize="sm">
										{t("dashboard.primaryArea")}
									</Text>
									<Heading size="md">
										{selectedCondominium.name}
									</Heading>
								</Box>
								<Badge variant="subtle">
									{t("dashboard.liveBadge")}
								</Badge>
							</Flex>
							<Grid
								templateColumns="repeat(2, minmax(0, 1fr))"
								gap="4"
							>
								{Array.from({ length: 4 }).map((_, index) => (
									<Box
										key={index}
										borderWidth="1px"
										h="24"
										borderRadius="sm"
									/>
								))}
							</Grid>
						</Box>

						<Box borderWidth="1px" p="6">
							<Heading size="md" mb="4">
								{t("dashboard.quickActions")}
							</Heading>
							<Stack gap="3">
								{quickActions.map((action) => (
									<Button
										key={action.path}
										variant="outline"
										justifyContent="space-between"
										onClick={() => navigate(action.path)}
									>
										<Text>{action.label}</Text>
										<LuArrowRight />
									</Button>
								))}
							</Stack>
						</Box>
					</SimpleGrid>
				</Stack>
			)}
		</DashboardContainer>
	);
}
