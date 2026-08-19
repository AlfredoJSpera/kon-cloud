import {
	Badge,
	Box,
	Button,
	Card,
	createListCollection,
	Flex,
	Grid,
	HStack,
	IconButton,
	Portal,
	Select,
	Spinner,
	Stack,
	Table,
	Tabs,
	Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LuPlus,
	LuCreditCard,
	LuTrash2,
	LuPencil,
	LuCoins,
	LuArrowDownRight,
	LuArrowUpRight,
	LuWallet,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useCondominium } from "@/hooks/useCondominium";
import type { ITenantOutput } from "@backend-interfaces/tenant";
import type {
	IDueOutput,
	IPaymentOutput,
	ITenantBalanceOutput,
} from "@backend-interfaces/due";
import { makeApiRequest } from "@/api/api";
import { DueModal } from "@/components/dues/DueModal";
import { PaymentModal } from "@/components/dues/PaymentModal";
import { toaster } from "@/components/chakraui/toaster";

export function DuesPage() {
	const { t } = useTranslation();
	const { selectedCondominium } = useCondominium();

	const [tenants, setTenants] = useState<ITenantOutput[]>([]);
	const [dues, setDues] = useState<IDueOutput[]>([]);
	const [payments, setPayments] = useState<IPaymentOutput[]>([]);
	const [balances, setBalances] = useState<ITenantBalanceOutput[]>([]);
	const [selectedTenantId, setSelectedTenantId] = useState<string>("");

	const tenantCollection = useMemo(() => {
		return createListCollection({
			items: [
				{ label: t("dues.allTenants"), value: "" },
				...tenants.map((tenant) => ({
					label: `${tenant.firstName} ${tenant.lastName} (${tenant.apartmentNumber})`,
					value: String(tenant.tenantId),
				})),
			],
		});
	}, [tenants, t]);

	const [loading, setLoading] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [isDueModalOpen, setIsDueModalOpen] = useState(false);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [editingDue, setEditingDue] = useState<IDueOutput | null>(null);
	const [editingPayment, setEditingPayment] = useState<IPaymentOutput | null>(
		null,
	);

	const handleEditDue = (due: IDueOutput) => {
		setEditingDue(due);
		setIsDueModalOpen(true);
	};

	const handleEditPayment = (payment: IPaymentOutput) => {
		setEditingPayment(payment);
		setIsPaymentModalOpen(true);
	};

	const loadData = useCallback(async () => {
		if (!selectedCondominium) {
			setTenants([]);
			setDues([]);
			setPayments([]);
			setBalances([]);
			return;
		}

		setLoading(true);
		setFetchError(null);
		const condoId = selectedCondominium.condominiumId;
		const tenantIdParam = selectedTenantId
			? parseInt(selectedTenantId, 10)
			: undefined;

		try {
			const [tenantsRes, duesRes, paymentsRes, balancesRes] =
				await Promise.all([
					makeApiRequest.tenants.list(condoId),
					makeApiRequest.dues.list(condoId, tenantIdParam),
					makeApiRequest.payments.list(condoId, tenantIdParam),
					makeApiRequest.dues.balances(condoId),
				]);

			setTenants(tenantsRes.data);
			setDues(duesRes.data);
			setPayments(paymentsRes.data);
			setBalances(balancesRes.data);
		} catch (error: unknown) {
			setFetchError("Failed to load dues and payments");
		} finally {
			setLoading(false);
		}
	}, [selectedCondominium, selectedTenantId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleDeleteDue = async (dueId: number) => {
		try {
			await makeApiRequest.dues.delete(dueId);
			toaster.create({
				title: t("dues.dueDeletedSuccess"),
				type: "success",
			});
			loadData();
		} catch (error: unknown) {
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: "Failed to delete due amount",
				type: "error",
			});
		}
	};

	const handleDeletePayment = async (paymentId: number) => {
		try {
			await makeApiRequest.payments.delete(paymentId);
			toaster.create({
				title: t("dues.paymentDeletedSuccess"),
				type: "success",
			});
			loadData();
		} catch (error: unknown) {
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: "Failed to delete payment",
				type: "error",
			});
		}
	};

	// Statistics calculations
	const totalDuesIssued = dues.reduce((sum, d) => sum + d.amount, 0);
	const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
	const totalCondoCredits = balances.reduce(
		(sum, b) => sum + b.currentBalance,
		0,
	);

	const selectedTenantBalance = selectedTenantId
		? balances.find((b) => b.tenantId === parseInt(selectedTenantId, 10))
		: null;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("it-IT", {
			style: "currency",
			currency: "EUR",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const formatDate = (isoString: string) => {
		if (!isoString) return "-";
		const date = new Date(isoString);
		return date.toLocaleDateString("it-IT", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle={selectedCondominium?.name || t("dues.title")}
			contentHeaderTitle={t("dues.title")}
			contentHeaderSubtitle={t("dues.subtitle")}
		>
			<Stack gap="6">
				{!selectedCondominium ? (
					<Box
						borderWidth="1px"
						borderRadius="lg"
						p={{ base: "6", md: "12" }}
						textAlign="center"
						bg="bg.panel"
					>
						<Text color="gray.500" mb="2" fontWeight="medium">
							{t("dashboard.noCondominiumSelected")}
						</Text>
						<Text fontSize="sm" color="gray.400">
							{t("dues.noCondominiumSelected")}
						</Text>
					</Box>
				) : (
					<>
						{/* Top Header Controls */}
						<Flex
							justify="space-between"
							align="center"
							wrap="wrap"
							gap="4"
						>
							<HStack gap="3" wrap="wrap">
								<Badge colorPalette="blue" size="lg" px="3" py="1">
									{selectedCondominium.name}
								</Badge>

								{/* Tenant Filter Selector */}
								<Select.Root
									collection={tenantCollection}
									size="sm"
									width="240px"
									value={[selectedTenantId]}
									onValueChange={(e) =>
										setSelectedTenantId(e.value[0] ?? "")
									}
									data-testid="tenant-filter-select"
								>
									<Select.HiddenSelect />
									<Select.Control>
										<Select.Trigger>
											<Select.ValueText
												placeholder={t("dues.allTenants")}
											/>
										</Select.Trigger>
										<Select.IndicatorGroup>
											<Select.Indicator />
										</Select.IndicatorGroup>
									</Select.Control>
									<Portal>
										<Select.Positioner>
											<Select.Content>
												{tenantCollection.items.map(
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
									</Portal>
								</Select.Root>
							</HStack>

							<HStack gap="3">
								<Button
									onClick={() => setIsDueModalOpen(true)}
									colorPalette="blue"
									data-testid="issue-due-btn"
								>
									<LuPlus />
									<Text>{t("dues.issueDue")}</Text>
								</Button>

								<Button
									onClick={() => setIsPaymentModalOpen(true)}
									variant="outline"
									colorPalette="green"
									data-testid="record-payment-btn"
								>
									<LuCreditCard />
									<Text>{t("dues.recordPayment")}</Text>
								</Button>
							</HStack>
						</Flex>

						{/* Stat Cards */}
						<Grid
							templateColumns={{
								base: "1fr",
								md: "repeat(3, 1fr)",
							}}
							gap="4"
						>
							<Card.Root size="sm">
								<Card.Body>
									<HStack justify="space-between">
										<Stack gap="1">
											<Text
												fontSize="xs"
												color="gray.500"
												fontWeight="medium"
											>
												{selectedTenantBalance
													? `${t("dues.currentBalance")} (${selectedTenantBalance.tenantName})`
													: t("dues.totalCredits")}
											</Text>
											<Text
												fontSize="2xl"
												fontWeight="bold"
												color={
													(
														selectedTenantBalance
															? selectedTenantBalance.currentBalance >
																0
															: totalCondoCredits > 0
													)
														? "orange.500"
														: "green.500"
												}
												data-testid="current-balance-display"
											>
												{formatCurrency(
													selectedTenantBalance
														? selectedTenantBalance.currentBalance
														: totalCondoCredits,
												)}
											</Text>
										</Stack>
										<Box
											p="3"
											borderRadius="full"
											bg="orange.50"
											color="orange.500"
										>
											<LuWallet size={24} />
										</Box>
									</HStack>
								</Card.Body>
							</Card.Root>

							<Card.Root size="sm">
								<Card.Body>
									<HStack justify="space-between">
										<Stack gap="1">
											<Text
												fontSize="xs"
												color="gray.500"
												fontWeight="medium"
											>
												{t("dues.totalDues")}
											</Text>
											<Text
												fontSize="2xl"
												fontWeight="bold"
												data-testid="total-dues-display"
											>
												{formatCurrency(
													selectedTenantBalance
														? selectedTenantBalance.totalDues
														: totalDuesIssued,
												)}
											</Text>
										</Stack>
										<Box
											p="3"
											borderRadius="full"
											bg="blue.50"
											color="blue.500"
										>
											<LuArrowUpRight size={24} />
										</Box>
									</HStack>
								</Card.Body>
							</Card.Root>

							<Card.Root size="sm">
								<Card.Body>
									<HStack justify="space-between">
										<Stack gap="1">
											<Text
												fontSize="xs"
												color="gray.500"
												fontWeight="medium"
											>
												{t("dues.totalPayments")}
											</Text>
											<Text
												fontSize="2xl"
												fontWeight="bold"
												color="green.600"
												data-testid="total-payments-display"
											>
												{formatCurrency(
													selectedTenantBalance
														? selectedTenantBalance.totalPayments
														: totalPaymentsReceived,
												)}
											</Text>
										</Stack>
										<Box
											p="3"
											borderRadius="full"
											bg="green.50"
											color="green.500"
										>
											<LuArrowDownRight size={24} />
										</Box>
									</HStack>
								</Card.Body>
							</Card.Root>
						</Grid>

						{/* Loading / Error States */}
						{loading ? (
							<Flex justify="center" py="12">
								<Spinner size="lg" />
							</Flex>
						) : fetchError ? (
							<Box p="4" bg="red.50" color="red.600" borderRadius="md">
								<Text>{fetchError}</Text>
							</Box>
						) : (
							/* Tabs View */
							<Tabs.Root defaultValue="dues">
								<Tabs.List>
									<Tabs.Trigger value="dues">
										<LuCoins />
										{t("dues.duesTab")} ({dues.length})
									</Tabs.Trigger>
									<Tabs.Trigger value="payments">
										<LuCreditCard />
										{t("dues.paymentsTab")} ({payments.length})
									</Tabs.Trigger>
								</Tabs.List>

								{/* Dues Tab Content */}
								<Tabs.Content value="dues" pt="4">
									{dues.length === 0 ? (
										<Box
											borderWidth="1px"
											borderRadius="lg"
											p="8"
											textAlign="center"
										>
											<Text color="gray.500">
												{t("dues.noDuesFound")}
											</Text>
										</Box>
									) : (
										<Table.ScrollArea
											borderWidth="1px"
											borderRadius="lg"
										>
											<Table.Root size="sm" variant="line">
												<Table.Header>
													<Table.Row>
														<Table.ColumnHeader>
															{t("dues.tenant")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("tenants.apartmentNumber")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("dues.amount")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("dues.reason")}
														</Table.ColumnHeader>
														<Table.ColumnHeader textAlign="end">
															{t("dues.actions")}
														</Table.ColumnHeader>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{dues.map((due) => (
														<Table.Row key={due.dueId}>
															<Table.Cell fontWeight="medium">
																{due.tenantName}
															</Table.Cell>
															<Table.Cell>
																{due.apartmentNumber}
															</Table.Cell>
															<Table.Cell
																fontWeight="bold"
																color="red.600"
															>
																{formatCurrency(due.amount)}
															</Table.Cell>
															<Table.Cell>
																{due.reason}
															</Table.Cell>
															<Table.Cell textAlign="end">
																<HStack gap="1" justify="flex-end">
																	<IconButton
																		size="xs"
																		variant="ghost"
																		colorPalette="blue"
																		onClick={() =>
																			handleEditDue(due)
																		}
																		data-testid={`edit-due-${due.dueId}`}
																		title={t("dues.edit")}
																	>
																		<LuPencil />
																	</IconButton>
																	<IconButton
																		size="xs"
																		variant="ghost"
																		colorPalette="red"
																		onClick={() =>
																			handleDeleteDue(
																				due.dueId,
																			)
																		}
																		data-testid={`delete-due-${due.dueId}`}
																	>
																		<LuTrash2 />
																	</IconButton>
																</HStack>
															</Table.Cell>
														</Table.Row>
													))}
												</Table.Body>
											</Table.Root>
										</Table.ScrollArea>
									)}
								</Tabs.Content>

								{/* Payments Tab Content */}
								<Tabs.Content value="payments" pt="4">
									{payments.length === 0 ? (
										<Box
											borderWidth="1px"
											borderRadius="lg"
											p="8"
											textAlign="center"
										>
											<Text color="gray.500">
												{t("dues.noDuesFound")}
											</Text>
										</Box>
									) : (
										<Table.ScrollArea
											borderWidth="1px"
											borderRadius="lg"
										>
											<Table.Root size="sm" variant="line">
												<Table.Header>
													<Table.Row>
														<Table.ColumnHeader>
															{t("dues.tenant")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("dues.paymentDate")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("dues.amount")}
														</Table.ColumnHeader>
														<Table.ColumnHeader>
															{t("dues.notes")}
														</Table.ColumnHeader>
														<Table.ColumnHeader textAlign="end">
															{t("dues.actions")}
														</Table.ColumnHeader>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{payments.map((payment) => (
														<Table.Row
															key={payment.paymentId}
														>
															<Table.Cell fontWeight="medium">
																{payment.tenantName}
															</Table.Cell>
															<Table.Cell>
																{formatDate(
																	payment.paymentDate,
																)}
															</Table.Cell>
															<Table.Cell
																fontWeight="bold"
																color="green.600"
															>
																{formatCurrency(
																	payment.amount,
																)}
															</Table.Cell>
															<Table.Cell>
																{payment.notes || "-"}
															</Table.Cell>
															<Table.Cell textAlign="end">
																<HStack gap="1" justify="flex-end">
																	<IconButton
																		size="xs"
																		variant="ghost"
																		colorPalette="blue"
																		onClick={() =>
																			handleEditPayment(
																				payment,
																			)
																		}
																		data-testid={`edit-payment-${payment.paymentId}`}
																		title={t("dues.edit")}
																	>
																		<LuPencil />
																	</IconButton>
																	<IconButton
																		size="xs"
																		variant="ghost"
																		colorPalette="red"
																		onClick={() =>
																			handleDeletePayment(
																				payment.paymentId,
																			)
																		}
																		data-testid={`delete-payment-${payment.paymentId}`}
																	>
																		<LuTrash2 />
																	</IconButton>
																</HStack>
															</Table.Cell>
														</Table.Row>
													))}
												</Table.Body>
											</Table.Root>
										</Table.ScrollArea>
									)}
								</Tabs.Content>
							</Tabs.Root>
						)}

						{/* Modals */}
						<DueModal
							open={isDueModalOpen}
							onClose={() => {
								setIsDueModalOpen(false);
								setEditingDue(null);
							}}
							tenants={tenants}
							defaultTenantId={
								selectedTenantId
									? parseInt(selectedTenantId, 10)
									: undefined
							}
							editingDue={editingDue}
							onSuccess={loadData}
						/>

						<PaymentModal
							open={isPaymentModalOpen}
							onClose={() => {
								setIsPaymentModalOpen(false);
								setEditingPayment(null);
							}}
							tenants={tenants}
							defaultTenantId={
								selectedTenantId
									? parseInt(selectedTenantId, 10)
									: undefined
							}
							editingPayment={editingPayment}
							onSuccess={loadData}
						/>
					</>
				)}
			</Stack>
		</DashboardContainer>
	);
}
