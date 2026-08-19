import {
	Badge,
	Box,
	Button,
	Card,
	createListCollection,
	Flex,
	Grid,
	HStack,
	Icon,
	Input,
	NativeSelect,
	Portal,
	Select,
	Spinner,
	Stack,
	Table,
	Text,
	Heading,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LuPlus,
	LuWallet,
	LuTrendingUp,
	LuTrendingDown,
	LuFilter,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { NoCondominiumSelected } from "@/components/condominiums/NoCondominiumSelected";
import { ActionMenu } from "@/components/common/ActionMenu";
import { useCondominium } from "@/hooks/useCondominium";
import type {
	IExpenseOutput,
	ICashBalanceOutput,
	ExpenseCategory,
} from "@backend-interfaces/expense";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import { useNavigate } from "react-router-dom";

const CATEGORY_COLOR_MAP: Record<ExpenseCategory, string> = {
	Utilities: "blue",
	Cleaning: "green",
	Maintenance: "orange",
	Insurance: "purple",
	Other: "gray",
};

export function ExpensesPage() {
	const { t } = useTranslation();
	const { selectedCondominium } = useCondominium();
	const navigate = useNavigate();

	const [expenses, setExpenses] = useState<IExpenseOutput[]>([]);
	const [cashBalanceInfo, setCashBalanceInfo] =
		useState<ICashBalanceOutput | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

	const categoryCollection = useMemo(() => {
		return createListCollection({
			items: [
				{ label: t("expenses.allCategories"), value: "ALL" },
				{ label: t("expenses.categories.Utilities"), value: "Utilities" },
				{ label: t("expenses.categories.Cleaning"), value: "Cleaning" },
				{ label: t("expenses.categories.Maintenance"), value: "Maintenance" },
				{ label: t("expenses.categories.Insurance"), value: "Insurance" },
				{ label: t("expenses.categories.Other"), value: "Other" },
			],
		});
	}, [t]);

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [editingExpense, setEditingExpense] = useState<IExpenseOutput | null>(
		null,
	);
	const [modalCategory, setModalCategory] =
		useState<ExpenseCategory>("Utilities");
	const [modalAmount, setModalAmount] = useState<string>("");
	const [modalDate, setModalDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [modalDescription, setModalDescription] = useState<string>("");
	const [submitting, setSubmitting] = useState<boolean>(false);

	// Delete state
	const [deletingExpense, setDeletingExpense] =
		useState<IExpenseOutput | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

	const fetchExpensesData = useCallback(async () => {
		if (!selectedCondominium) return;
		setLoading(true);
		try {
			const [expensesRes, cashRes] = await Promise.all([
				makeApiRequest.expenses.list(selectedCondominium.condominiumId),
				makeApiRequest.expenses.getCashBalance(
					selectedCondominium.condominiumId,
				),
			]);
			setExpenses(expensesRes.data);
			setCashBalanceInfo(cashRes.data);
		} catch (err: unknown) {
			console.error(err);
			toaster.create({
				title: t("dashboard.errorTitle"),
				description: t("condominiums.loadError"),
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	}, [selectedCondominium, t]);

	useEffect(() => {
		if (selectedCondominium) {
			fetchExpensesData();
		} else {
			setExpenses([]);
			setCashBalanceInfo(null);
		}
	}, [selectedCondominium, fetchExpensesData]);

	const filteredExpenses = useMemo(() => {
		if (categoryFilter === "ALL") return expenses;
		return expenses.filter((e) => e.category === categoryFilter);
	}, [expenses, categoryFilter]);

	const handleOpenCreateModal = () => {
		setEditingExpense(null);
		setModalCategory("Utilities");
		setModalAmount("");
		setModalDate(new Date().toISOString().split("T")[0]);
		setModalDescription("");
		setIsModalOpen(true);
	};

	const handleOpenEditModal = (expense: IExpenseOutput) => {
		setEditingExpense(expense);
		setModalCategory(expense.category);
		setModalAmount(expense.amount.toString());
		setModalDate(expense.expenseDate.split("T")[0]);
		setModalDescription(expense.description || "");
		setIsModalOpen(true);
	};

	const handleSaveExpense = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCondominium) return;

		const parsedAmount = parseFloat(modalAmount);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			toaster.create({
				title: t("register.validationErrorTitle"),
				description: t("register.fillRequiredFields"),
				type: "error",
			});
			return;
		}

		setSubmitting(true);
		try {
			if (editingExpense) {
				await makeApiRequest.expenses.update(editingExpense.expenseId, {
					category: modalCategory,
					amount: parsedAmount,
					expenseDate: new Date(modalDate).toISOString(),
					description: modalDescription || undefined,
				});
				toaster.create({
					title: t("expenses.updatedSuccess"),
					type: "success",
				});
			} else {
				await makeApiRequest.expenses.create({
					condominiumId: selectedCondominium.condominiumId,
					category: modalCategory,
					amount: parsedAmount,
					expenseDate: new Date(modalDate).toISOString(),
					description: modalDescription || undefined,
				});
				toaster.create({
					title: t("expenses.createdSuccess"),
					type: "success",
				});
			}
			setIsModalOpen(false);
			await fetchExpensesData();
		} catch (err: unknown) {
			console.error(err);
			toaster.create({
				title: t("dashboard.errorTitle"),
				type: "error",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteExpense = async () => {
		if (!deletingExpense) return;
		setSubmitting(true);
		try {
			await makeApiRequest.expenses.delete(deletingExpense.expenseId);
			toaster.create({
				title: t("expenses.deletedSuccess"),
				type: "success",
			});
			setIsDeleteModalOpen(false);
			setDeletingExpense(null);
			await fetchExpensesData();
		} catch (err: unknown) {
			console.error(err);
			toaster.create({
				title: t("dashboard.errorTitle"),
				type: "error",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle={
				selectedCondominium?.name || t("condominiums.selectCondominium")
			}
			contentHeaderSubtitle={t("expenses.subtitle")}
			contentHeaderTitle={t("expenses.title")}
		>
			{!selectedCondominium ? (
				<NoCondominiumSelected />
			) : (
				<Stack gap="6" data-testid="expenses-page-container">
					{/* Control Header & Filters */}
					<Flex
						justify="space-between"
						align="center"
						wrap="wrap"
						gap="4"
					>
						<HStack gap="3">
							<Badge colorPalette="blue" size="lg" px="3" py="1">
								{selectedCondominium.name}
							</Badge>
							<Select.Root
								collection={categoryCollection}
								size="sm"
								width="220px"
								value={[categoryFilter]}
								onValueChange={(e) =>
									setCategoryFilter(e.value[0] ?? "ALL")
								}
								data-testid="category-filter-select"
							>
								<Select.HiddenSelect />
								<Select.Control>
									<Select.Trigger>
										<Select.ValueText
											placeholder={t("expenses.allCategories")}
										/>
									</Select.Trigger>
									<Select.IndicatorGroup>
										<Select.Indicator />
									</Select.IndicatorGroup>
								</Select.Control>
								<Portal>
									<Select.Positioner>
										<Select.Content>
											{categoryCollection.items.map((item) => (
												<Select.Item
													item={item}
													key={item.value}
												>
													{item.label}
													<Select.ItemIndicator />
												</Select.Item>
											))}
										</Select.Content>
									</Select.Positioner>
								</Portal>
							</Select.Root>
						</HStack>

						<Button
							onClick={handleOpenCreateModal}
							data-testid="record-expense-btn"
						>
							<HStack gap="2">
								<LuPlus />
								<Text>{t("expenses.recordExpense")}</Text>
							</HStack>
						</Button>
					</Flex>

					{/* Financial Summary Cards */}
					<Grid
						templateColumns={{
							base: "1fr",
							md: "repeat(3, 1fr)",
						}}
						gap="4"
					>
						{/* Total Cash Balance Card */}
						<Card.Root
							borderWidth="2px"
							borderColor={
								(cashBalanceInfo?.cashBalance ?? 0) >= 0
									? "green.500"
									: "red.500"
							}
							data-testid="cash-balance-card"
						>
							<Card.Body p="5">
								<HStack justify="space-between" align="start">
									<Stack gap="1">
										<Text
											fontSize="xs"
											fontWeight="semibold"
											textTransform="uppercase"
											color="gray.600"
										>
											{t("expenses.totalCashBalance")}
										</Text>
										<Text
											fontSize="2xl"
											fontWeight="bold"
											color={
												(cashBalanceInfo?.cashBalance ??
													0) >= 0
													? "green.700"
													: "red.700"
											}
											data-testid="cash-balance-value"
										>
											{new Intl.NumberFormat("de-DE", {
												style: "currency",
												currency: "EUR",
											}).format(
												cashBalanceInfo?.cashBalance ??
													0,
											)}
										</Text>
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

						{/* Total Payments Card */}
						<Card.Root borderWidth="1px">
							<Card.Body p="5">
								<HStack justify="space-between" align="start">
									<Stack gap="1">
										<Text
											fontSize="xs"
											fontWeight="semibold"
											textTransform="uppercase"
											color="gray.600"
										>
											{t("expenses.totalPayments")}
										</Text>
										<Text
											fontSize="2xl"
											fontWeight="bold"
											color="blue.600"
											data-testid="total-payments-value"
										>
											{new Intl.NumberFormat("de-DE", {
												style: "currency",
												currency: "EUR",
											}).format(
												cashBalanceInfo?.totalPayments ??
													0,
											)}
										</Text>
									</Stack>
									<Icon
										as={LuTrendingUp}
										boxSize="8"
										color="blue.500"
									/>
								</HStack>
							</Card.Body>
						</Card.Root>

						{/* Total Expenses Paid Card */}
						<Card.Root borderWidth="1px">
							<Card.Body p="5">
								<HStack justify="space-between" align="start">
									<Stack gap="1">
										<Text
											fontSize="xs"
											fontWeight="semibold"
											textTransform="uppercase"
											color="gray.600"
										>
											{t("expenses.totalExpenses")}
										</Text>
										<Text
											fontSize="2xl"
											fontWeight="bold"
											color="purple.600"
											data-testid="total-expenses-value"
										>
											{new Intl.NumberFormat("de-DE", {
												style: "currency",
												currency: "EUR",
											}).format(
												cashBalanceInfo?.totalExpenses ??
													0,
											)}
										</Text>
									</Stack>
									<Icon
										as={LuTrendingDown}
										boxSize="8"
										color="purple.500"
									/>
								</HStack>
							</Card.Body>
						</Card.Root>
					</Grid>

					{/* Expenses Table */}
					{loading ? (
						<Flex justify="center" py="12">
							<Spinner size="lg" />
						</Flex>
					) : filteredExpenses.length === 0 ? (
						<Box
							borderWidth="1px"
							borderRadius="md"
							p="8"
							textAlign="center"
							data-testid="no-expenses-message"
						>
							<Text color="gray.500">
								{t("expenses.noExpensesFound")}
							</Text>
						</Box>
					) : (
						<Box
							borderWidth="1px"
							borderRadius="md"
							overflowX="auto"
						>
							<Table.Root
								size="md"
								variant="line"
								data-testid="expenses-table"
							>
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
										<Table.ColumnHeader textAlign="right">
											{t("expenses.actions")}
										</Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{filteredExpenses.map((expense) => (
										<Table.Row
											key={expense.expenseId}
											data-testid={`expense-row-${expense.expenseId}`}
										>
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
													size="md"
													data-testid={`category-badge-${expense.category}`}
												>
													{t(
														`expenses.categories.${expense.category}` as unknown as TemplateStringsArray,
													)}
												</Badge>
											</Table.Cell>
											<Table.Cell>
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
											<Table.Cell textAlign="right">
												<ActionMenu
													onEdit={() =>
														handleOpenEditModal(
															expense,
														)
													}
													onDelete={() => {
														setDeletingExpense(
															expense,
														);
														setIsDeleteModalOpen(
															true,
														);
													}}
													triggerTestId={`expense-actions-btn-${expense.expenseId}`}
													editTestId={`edit-expense-btn-${expense.expenseId}`}
													deleteTestId={`delete-expense-btn-${expense.expenseId}`}
												/>
											</Table.Cell>
										</Table.Row>
									))}
								</Table.Body>
							</Table.Root>
						</Box>
					)}
				</Stack>
			)}

			{/* Record / Edit Expense Dialog */}
			{isModalOpen && (
				<Box
					position="fixed"
					inset="0"
					bg="blackAlpha.600"
					zIndex="1400"
					display="flex"
					alignItems="center"
					justifyContent="center"
					p="4"
				>
					<Box
						bg="white"
						_dark={{ bg: "gray.800" }}
						borderRadius="lg"
						boxShadow="xl"
						maxW="500px"
						w="full"
						p="6"
					>
						<Heading size="md" mb="4">
							{editingExpense
								? t("expenses.editTitle")
								: t("expenses.addTitle")}
						</Heading>
						<form onSubmit={handleSaveExpense}>
							<Stack gap="4">
								<Box>
									<Text
										fontSize="sm"
										fontWeight="medium"
										mb="1"
									>
										{t("expenses.category")} *
									</Text>
									<NativeSelect.Root size="md" w="full">
										<NativeSelect.Field
											value={modalCategory}
											onChange={(e) =>
												setModalCategory(
													e.target
														.value as ExpenseCategory,
												)
											}
											data-testid="modal-category-select"
										>
											<option value="Utilities">
												{t(
													"expenses.categories.Utilities",
												)}
											</option>
											<option value="Cleaning">
												{t(
													"expenses.categories.Cleaning",
												)}
											</option>
											<option value="Maintenance">
												{t(
													"expenses.categories.Maintenance",
												)}
											</option>
											<option value="Insurance">
												{t(
													"expenses.categories.Insurance",
												)}
											</option>
											<option value="Other">
												{t("expenses.categories.Other")}
											</option>
										</NativeSelect.Field>
									</NativeSelect.Root>
								</Box>

								<Box>
									<Text
										fontSize="sm"
										fontWeight="medium"
										mb="1"
									>
										{t("expenses.amount")} *
									</Text>
									<Input
										type="number"
										step="0.01"
										min="0.01"
										placeholder="0.00"
										value={modalAmount}
										onChange={(e) =>
											setModalAmount(e.target.value)
										}
										required
										data-testid="modal-amount-input"
									/>
								</Box>

								<Box>
									<Text
										fontSize="sm"
										fontWeight="medium"
										mb="1"
									>
										{t("expenses.expenseDate")} *
									</Text>
									<Input
										type="date"
										value={modalDate}
										onChange={(e) =>
											setModalDate(e.target.value)
										}
										required
										data-testid="modal-date-input"
									/>
								</Box>

								<Box>
									<Text
										fontSize="sm"
										fontWeight="medium"
										mb="1"
									>
										{t("expenses.description")}
									</Text>
									<Input
										placeholder={t(
											"expenses.descriptionPlaceholder",
										)}
										value={modalDescription}
										onChange={(e) =>
											setModalDescription(e.target.value)
										}
										data-testid="modal-description-input"
									/>
								</Box>

								<HStack justify="end" gap="3" mt="4">
									<Button
										variant="outline"
										onClick={() => setIsModalOpen(false)}
										disabled={submitting}
									>
										{t("expenses.cancel")}
									</Button>
									<Button
										colorPalette="blue"
										type="submit"
										loading={submitting}
										data-testid="modal-save-expense-btn"
									>
										{t("expenses.save")}
									</Button>
								</HStack>
							</Stack>
						</form>
					</Box>
				</Box>
			)}

			{/* Delete Confirmation Dialog */}
			{isDeleteModalOpen && deletingExpense && (
				<Box
					position="fixed"
					inset="0"
					bg="blackAlpha.600"
					zIndex="1400"
					display="flex"
					alignItems="center"
					justifyContent="center"
					p="4"
				>
					<Box
						bg="white"
						_dark={{ bg: "gray.800" }}
						borderRadius="lg"
						boxShadow="xl"
						maxW="450px"
						w="full"
						p="6"
					>
						<Heading size="md" mb="2">
							{t("expenses.deleteTitle")}
						</Heading>
						<Text color="gray.600" mb="2">
							{t("expenses.deleteConfirmation")}
						</Text>
						<Text fontSize="sm" color="gray.500" mb="6">
							{t("expenses.deleteSubtext")}
						</Text>

						<HStack justify="end" gap="3">
							<Button
								variant="outline"
								onClick={() => {
									setIsDeleteModalOpen(false);
									setDeletingExpense(null);
								}}
								disabled={submitting}
							>
								{t("expenses.cancel")}
							</Button>
							<Button
								colorPalette="red"
								onClick={handleDeleteExpense}
								loading={submitting}
								data-testid="confirm-delete-expense-btn"
							>
								{t("condominiums.delete")}
							</Button>
						</HStack>
					</Box>
				</Box>
			)}
		</DashboardContainer>
	);
}
