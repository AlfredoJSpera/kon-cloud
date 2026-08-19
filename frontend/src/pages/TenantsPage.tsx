import {
	Badge,
	Box,
	Button,
	Flex,
	HStack,
	IconButton,
	Spinner,
	Stack,
	Table,
	Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LuPlus,
	LuEllipsisVertical,
	LuPencil,
	LuTrash2,
	LuUserCheck,
	LuMail,
	LuPhone,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useCondominium } from "@/hooks/useCondominium";
import type { ITenantOutput } from "@backend-interfaces/tenant";
import { makeApiRequest } from "@/api/api";
import { TenantModal } from "@/components/tenants/TenantModal";
import { DeleteTenantDialog } from "@/components/tenants/DeleteTenantDialog";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "@/components/chakraui/menu";

export function TenantsPage() {
	const { t } = useTranslation();
	const { selectedCondominium } = useCondominium();

	const [tenants, setTenants] = useState<ITenantOutput[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTenant, setEditingTenant] = useState<ITenantOutput | null>(
		null,
	);

	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingTenant, setDeletingTenant] = useState<ITenantOutput | null>(
		null,
	);

	const loadTenants = useCallback(async () => {
		if (!selectedCondominium) {
			setTenants([]);
			return;
		}

		setLoading(true);
		setFetchError(null);
		try {
			const res = await makeApiRequest.tenants.list(
				selectedCondominium.condominiumId,
			);
			setTenants(res.data);
		} catch (error: unknown) {
			setFetchError("Failed to load tenants");
		} finally {
			setLoading(false);
		}
	}, [selectedCondominium]);

	useEffect(() => {
		loadTenants();
	}, [loadTenants]);

	const handleOpenAdd = () => {
		setEditingTenant(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (tenant: ITenantOutput) => {
		setEditingTenant(tenant);
		setIsModalOpen(true);
	};

	const handleOpenDelete = (tenant: ITenantOutput) => {
		setDeletingTenant(tenant);
		setIsDeleteOpen(true);
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle={selectedCondominium?.name || t("tenants.title")}
			contentHeaderTitle={t("tenants.title")}
			contentHeaderSubtitle={t("tenants.subtitle")}
		>
			<Stack gap="6">
				{!selectedCondominium ? (
					/* No Condominium Selected State */
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
							{t("tenants.noCondominiumSelected")}
						</Text>
					</Box>
				) : (
					<>
						{/* Top Actions */}
						<Flex
							justify="space-between"
							align="center"
							wrap="wrap"
							gap="4"
						>
							<HStack gap="2">
								<Badge
									colorPalette="blue"
									size="lg"
									px="3"
									py="1"
								>
									{selectedCondominium.name}
								</Badge>
							</HStack>

							<Button
								onClick={handleOpenAdd}
								data-testid="add-tenant-btn"
							>
								<HStack gap="2">
									<LuPlus />
									<Text>{t("tenants.addNew")}</Text>
								</HStack>
							</Button>
						</Flex>

						{/* Loading State */}
						{loading && tenants.length === 0 ? (
							<Flex justify="center" align="center" py="12">
								<Spinner size="lg" />
							</Flex>
						) : fetchError ? (
							<Box
								borderWidth="1px"
								borderRadius="lg"
								p="6"
								textAlign="center"
								color="red.500"
							>
								<Text>{fetchError}</Text>
							</Box>
						) : tenants.length === 0 ? (
							/* Empty State */
							<Box
								borderWidth="1px"
								borderRadius="lg"
								p={{ base: "6", md: "12" }}
								textAlign="center"
							>
								<Text color="gray.500" mb="4">
									{t("tenants.noTenantsFound")}
								</Text>
								<Button onClick={handleOpenAdd}>
									<LuPlus /> {t("tenants.addNew")}
								</Button>
							</Box>
						) : (
							<>
								{/* Desktop Table View (visible on md+) */}
								<Box
									display={{ base: "none", md: "block" }}
									borderWidth="1px"
									borderRadius="md"
									overflow="hidden"
								>
									<Table.Root size="md" variant="line">
										<Table.Header>
											<Table.Row>
												<Table.ColumnHeader w="12"></Table.ColumnHeader>
												<Table.ColumnHeader>
													{t("tenants.firstName")}
												</Table.ColumnHeader>
												<Table.ColumnHeader>
													{t("tenants.lastName")}
												</Table.ColumnHeader>
												<Table.ColumnHeader>
													{t(
														"tenants.apartmentNumber",
													)}
												</Table.ColumnHeader>
												<Table.ColumnHeader>
													{t("tenants.contactMethod")}
												</Table.ColumnHeader>
												<Table.ColumnHeader
													w="20"
													textAlign="right"
												>
													{t("tenants.actions")}
												</Table.ColumnHeader>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{tenants.map((item) => (
												<Table.Row
													key={item.tenantId}
													data-testid={`tenant-row-${item.tenantId}`}
												>
													<Table.Cell>
														<LuUserCheck />
													</Table.Cell>
													<Table.Cell fontWeight="medium">
														{item.firstName}
													</Table.Cell>
													<Table.Cell fontWeight="medium">
														{item.lastName}
													</Table.Cell>
													<Table.Cell>
														<Badge
															colorPalette="teal"
															variant="subtle"
														>
															{
																item.apartmentNumber
															}
														</Badge>
													</Table.Cell>
													<Table.Cell color="gray.600">
														<Stack gap="1">
															{item.email && (
																<HStack gap="2">
																	<LuMail />
																	<Text fontSize="sm">
																		{
																			item.email
																		}
																	</Text>
																</HStack>
															)}
															{item.phone && (
																<HStack gap="2">
																	<LuPhone />
																	<Text fontSize="sm">
																		{
																			item.phone
																		}
																	</Text>
																</HStack>
															)}
														</Stack>
													</Table.Cell>
													<Table.Cell textAlign="right">
														<MenuRoot>
															<MenuTrigger
																asChild
															>
																<IconButton
																	aria-label="Actions"
																	variant="ghost"
																	size="sm"
																	data-testid={`tenant-actions-btn-${item.tenantId}`}
																>
																	<LuEllipsisVertical />
																</IconButton>
															</MenuTrigger>
															<MenuContent>
																<MenuItem
																	value="edit"
																	onClick={() =>
																		handleOpenEdit(
																			item,
																		)
																	}
																	data-testid={`tenant-edit-btn-${item.tenantId}`}
																>
																	<HStack gap="2">
																		<LuPencil />
																		<Text>
																			{t(
																				"condominiums.edit",
																			)}
																		</Text>
																	</HStack>
																</MenuItem>
																<MenuItem
																	value="delete"
																	color="red.500"
																	onClick={() =>
																		handleOpenDelete(
																			item,
																		)
																	}
																	data-testid={`tenant-delete-btn-${item.tenantId}`}
																>
																	<HStack
																		gap="2"
																		color="red.500"
																	>
																		<LuTrash2 />
																		<Text color="red.500">
																			{t(
																				"condominiums.delete",
																			)}
																		</Text>
																	</HStack>
																</MenuItem>
															</MenuContent>
														</MenuRoot>
													</Table.Cell>
												</Table.Row>
											))}
										</Table.Body>
									</Table.Root>
								</Box>

								{/* Mobile Card View (visible on base / < md) */}
								<Stack
									display={{ base: "flex", md: "none" }}
									gap="4"
								>
									{tenants.map((item) => (
										<Box
											key={item.tenantId}
											borderWidth="1px"
											borderRadius="md"
											p="4"
											bg="bg.panel"
											data-testid={`tenant-card-${item.tenantId}`}
										>
											<Flex
												justify="space-between"
												align="start"
											>
												<Box>
													<Text
														fontWeight="bold"
														fontSize="md"
													>
														{item.firstName}{" "}
														{item.lastName}
													</Text>
													<Badge
														colorPalette="teal"
														variant="subtle"
														mt="1"
														mb="2"
													>
														{item.apartmentNumber}
													</Badge>
													<Stack
														gap="1"
														fontSize="sm"
													>
														{item.email && (
															<HStack gap="2">
																<LuMail />
																<Text>
																	{item.email}
																</Text>
															</HStack>
														)}
														{item.phone && (
															<HStack gap="2">
																<LuPhone />
																<Text>
																	{item.phone}
																</Text>
															</HStack>
														)}
													</Stack>
												</Box>

												<MenuRoot>
													<MenuTrigger asChild>
														<IconButton
															aria-label="Actions"
															variant="ghost"
															size="sm"
														>
															<LuEllipsisVertical />
														</IconButton>
													</MenuTrigger>
													<MenuContent>
														<MenuItem
															value="edit"
															onClick={() =>
																handleOpenEdit(
																	item,
																)
															}
														>
															<HStack gap="2">
																<LuPencil />
																<Text>
																	{t(
																		"condominiums.edit",
																	)}
																</Text>
															</HStack>
														</MenuItem>
														<MenuItem
															value="delete"
															color="red.500"
															onClick={() =>
																handleOpenDelete(
																	item,
																)
															}
														>
															<HStack
																gap="2"
																color="red.500"
															>
																<LuTrash2 />
																<Text color="red.500">
																	{t(
																		"condominiums.delete",
																	)}
																</Text>
															</HStack>
														</MenuItem>
													</MenuContent>
												</MenuRoot>
											</Flex>
										</Box>
									))}
								</Stack>
							</>
						)}

						{/* Add/Edit Modal */}
						<TenantModal
							open={isModalOpen}
							onClose={() => setIsModalOpen(false)}
							condominiumId={selectedCondominium.condominiumId}
							editingTenant={editingTenant}
							onSuccess={loadTenants}
						/>

						{/* Delete Dialog */}
						<DeleteTenantDialog
							open={isDeleteOpen}
							onClose={() => setIsDeleteOpen(false)}
							tenant={deletingTenant}
							onSuccess={loadTenants}
						/>
					</>
				)}
			</Stack>
		</DashboardContainer>
	);
}
