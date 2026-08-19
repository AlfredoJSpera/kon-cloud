import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Spinner,
	Stack,
	Table,
	Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
	LuArrowRight,
	LuWallet,
	LuTrendingUp,
	LuTrendingDown,
	LuBuilding,
	LuReceipt,
	LuUsers,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useCondominium } from "@/hooks/useCondominium";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { makeApiRequest } from "@/api/api";
import type {
	ICashBalanceOutput,
	IExpenseOutput,
	ExpenseCategory,
} from "@backend-interfaces/expense";

const CATEGORY_COLOR_MAP: Record<ExpenseCategory, string> = {
	Utilities: "blue",
	Cleaning: "green",
	Maintenance: "orange",
	Insurance: "purple",
	Other: "gray",
};

export function DashboardPage() {
	const { t } = useTranslation();
	const { selectedCondominium } = useCondominium();
	const navigate = useNavigate();

	const [cashBalanceInfo, setCashBalanceInfo] =
		useState<ICashBalanceOutput | null>(null);
	const [recentExpenses, setRecentExpenses] = useState<IExpenseOutput[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const fetchDashboardData = useCallback(async () => {
		if (!selectedCondominium) return;
		setLoading(true);
		try {
			const [cashRes, expensesRes] = await Promise.all([
				makeApiRequest.expenses.getCashBalance(
					selectedCondominium.condominiumId,
				),
				makeApiRequest.expenses.list(selectedCondominium.condominiumId),
			]);
			setCashBalanceInfo(cashRes.data);
			setRecentExpenses(expensesRes.data.slice(0, 5)); // top 5 recent
		} catch (err: unknown) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, [selectedCondominium]);

	useEffect(() => {
		if (selectedCondominium) {
			fetchDashboardData();
		} else {
			setCashBalanceInfo(null);
			setRecentExpenses([]);
		}
	}, [selectedCondominium, fetchDashboardData]);

	// Calculate breakdown per category
	const categoryBreakdown = recentExpenses.reduce(
		(acc, exp) => {
			acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
			return acc;
		},
		{} as Record<ExpenseCategory, number>,
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
				/* Case 2: Condominium Selected - Real Financial Overview */
				<Stack gap="6" data-testid="condo-selected-container">
					{/* Condominium Header Banner */}
					<Box
						borderWidth="1px"
						borderRadius="lg"
						p={{ base: "4", md: "6" }}
					>
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

						{/* Real Financial Cards */}
						{loading ? (
							<Flex justify="center" py="8">
								<Spinner size="lg" />
							</Flex>
						) : (
							<SimpleGrid
								columns={{ base: 1, md: 3 }}
								gap="4"
								mt="6"
							>
								{/* Total Cash Balance */}
								<Card.Root
									borderWidth="2px"
									borderColor={
										(cashBalanceInfo?.cashBalance ?? 0) >= 0
											? "green.500"
											: "red.500"
									}
									bg={
										(cashBalanceInfo?.cashBalance ?? 0) >= 0
											? "green.50/30"
											: "red.50/30"
									}
									data-testid="dashboard-cash-balance-card"
								>
									<Card.Body p="5">
										<HStack
											justify="space-between"
											align="start"
										>
											<Stack gap="1">
												<Text
													fontSize="xs"
													fontWeight="semibold"
													textTransform="uppercase"
													color="gray.600"
												>
													{t(
														"expenses.totalCashBalance",
													)}
												</Text>
												<Heading
													size="xl"
													color={
														(cashBalanceInfo?.cashBalance ??
															0) >= 0
															? "green.700"
															: "red.700"
													}
													data-testid="dashboard-cash-balance-value"
												>
													{new Intl.NumberFormat(
														"de-DE",
														{
															style: "currency",
															currency: "EUR",
														},
													).format(
														cashBalanceInfo?.cashBalance ??
															0,
													)}
												</Heading>
											</Stack>
											<Icon
												as={LuWallet}
												boxSize="8"
												color={
													(cashBalanceInfo?.cashBalance ??
														0) >= 0
														? "green.600"
														: "red.600"
												}
											/>
										</HStack>
									</Card.Body>
								</Card.Root>

								{/* Total Tenant Payments */}
								<Card.Root
									borderWidth="1px"
									data-testid="dashboard-total-payments-card"
								>
									<Card.Body p="5">
										<HStack
											justify="space-between"
											align="start"
										>
											<Stack gap="1">
												<Text
													fontSize="xs"
													fontWeight="semibold"
													textTransform="uppercase"
													color="gray.600"
												>
													{t(
														"expenses.totalPayments",
													)}
												</Text>
												<Heading
													size="xl"
													color="blue.600"
												>
													{new Intl.NumberFormat(
														"de-DE",
														{
															style: "currency",
															currency: "EUR",
														},
													).format(
														cashBalanceInfo?.totalPayments ??
															0,
													)}
												</Heading>
											</Stack>
											<Icon
												as={LuTrendingUp}
												boxSize="8"
												color="blue.500"
											/>
										</HStack>
									</Card.Body>
								</Card.Root>

								{/* Total Expenses Paid */}
								<Card.Root
									borderWidth="1px"
									data-testid="dashboard-total-expenses-card"
								>
									<Card.Body p="5">
										<HStack
											justify="space-between"
											align="start"
										>
											<Stack gap="1">
												<Text
													fontSize="xs"
													fontWeight="semibold"
													textTransform="uppercase"
													color="gray.600"
												>
													{t(
														"expenses.totalExpenses",
													)}
												</Text>
												<Heading
													size="xl"
													color="purple.600"
												>
													{new Intl.NumberFormat(
														"de-DE",
														{
															style: "currency",
															currency: "EUR",
														},
													).format(
														cashBalanceInfo?.totalExpenses ??
															0,
													)}
												</Heading>
											</Stack>
											<Icon
												as={LuTrendingDown}
												boxSize="8"
												color="purple.500"
											/>
										</HStack>
									</Card.Body>
								</Card.Root>
							</SimpleGrid>
						)}
					</Box>

					{/* Section: Category Breakdown & Quick Actions */}
					<Grid
						templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
						gap="6"
					>
						{/* Recent Expenses List */}
						<Box borderWidth="1px" borderRadius="lg" p="6">
							<Flex justify="space-between" align="center" mb="4">
								<Heading size="md">
									{t("dashboard.recentExpenses")}
								</Heading>
								<Button
									size="sm"
									variant="ghost"
									colorPalette="blue"
									onClick={() => navigate("/expenses")}
								>
									<HStack gap="1">
										<Text>
											{t("dashboard.manageExpenses")}
										</Text>
										<LuArrowRight />
									</HStack>
								</Button>
							</Flex>

							{recentExpenses.length === 0 ? (
								<Text color="gray.500" fontSize="sm">
									{t("expenses.noExpensesFound")}
								</Text>
							) : (
								<Table.Root size="sm" variant="line">
									<Table.Header>
										<Table.Row>
											<Table.ColumnHeader>
												{t("expenses.expenseDate")}
											</Table.ColumnHeader>
											<Table.ColumnHeader>
												{t("expenses.category")}
											</Table.ColumnHeader>
											<Table.ColumnHeader>
												{t("expenses.description")}
											</Table.ColumnHeader>
											<Table.ColumnHeader textAlign="right">
												{t("expenses.amount")}
											</Table.ColumnHeader>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{recentExpenses.map((expense) => (
											<Table.Row key={expense.expenseId}>
												<Table.Cell>
													{new Date(
														expense.expenseDate,
													).toLocaleDateString()}
												</Table.Cell>
												<Table.Cell>
													<Badge
														colorPalette={
															CATEGORY_COLOR_MAP[
																expense.category
															] || "gray"
														}
														variant="subtle"
														size="xs"
													>
														{t(
															`expenses.categories.${expense.category}` as unknown as TemplateStringsArray,
														)}
													</Badge>
												</Table.Cell>
												<Table.Cell fontSize="xs">
													{expense.description || "-"}
												</Table.Cell>
												<Table.Cell
													textAlign="right"
													fontWeight="semibold"
												>
													{new Intl.NumberFormat(
														"de-DE",
														{
															style: "currency",
															currency: "EUR",
														},
													).format(expense.amount)}
												</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Root>
							)}
						</Box>

						{/* Quick Actions & Navigation */}
						<Box borderWidth="1px" borderRadius="lg" p="6">
							<Heading size="md" mb="4">
								{t("dashboard.quickActions")}
							</Heading>
							<Stack gap="3">
								<Button
									variant="outline"
									justifyContent="space-between"
									onClick={() => navigate("/expenses")}
									data-testid="goto-expenses-btn"
								>
									<HStack gap="2">
										<LuWallet />
										<Text>{t("expenses.title")}</Text>
									</HStack>
									<LuArrowRight />
								</Button>
								<Button
									variant="outline"
									justifyContent="space-between"
									onClick={() => navigate("/dues")}
									data-testid="goto-dues-btn"
								>
									<HStack gap="2">
										<LuReceipt />
										<Text>{t("dues.title")}</Text>
									</HStack>
									<LuArrowRight />
								</Button>
								<Button
									variant="outline"
									justifyContent="space-between"
									onClick={() => navigate("/tenants")}
									data-testid="goto-tenants-btn"
								>
									<HStack gap="2">
										<LuUsers />
										<Text>{t("tenants.title")}</Text>
									</HStack>
									<LuArrowRight />
								</Button>
							</Stack>
						</Box>
					</Grid>
				</Stack>
			)}
		</DashboardContainer>
	);
}
