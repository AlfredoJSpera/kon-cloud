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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	LuPlus,
	LuEllipsisVertical,
	LuPencil,
	LuTrash2,
	LuCircleCheck,
	LuCircle,
} from "react-icons/lu";
import { DashboardContainer } from "@/components/dashboard-container/DashboardContainer";
import { useCondominium } from "@/hooks/useCondominium";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";
import { CondominiumModal } from "@/components/condominiums/CondominiumModal";
import { DeleteCondominiumDialog } from "@/components/condominiums/DeleteCondominiumDialog";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "@/components/chakraui/menu";

export function CondominiumsPage() {
	const { t } = useTranslation();
	const {
		condominiums,
		selectedCondominium,
		setSelectedCondominium,
		loading,
	} = useCondominium();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCondo, setEditingCondo] = useState<ICondominiumOutput | null>(
		null,
	);

	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingCondo, setDeletingCondo] =
		useState<ICondominiumOutput | null>(null);

	const handleOpenAdd = () => {
		setEditingCondo(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (condo: ICondominiumOutput) => {
		setEditingCondo(condo);
		setIsModalOpen(true);
	};

	const handleOpenDelete = (condo: ICondominiumOutput) => {
		setDeletingCondo(condo);
		setIsDeleteOpen(true);
	};

	return (
		<DashboardContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading={t("topbar.navigation")}
			topBarTitle={selectedCondominium?.name || t("condominiums.title")}
			contentHeaderTitle={t("condominiums.title")}
			contentHeaderSubtitle={t("condominiums.subtitle")}
		>
			<Stack gap="6">
				{/* Top Section */}
				<Flex
					justify="space-between"
					align="center"
					wrap="wrap"
					gap="4"
				>
					<Button
						onClick={handleOpenAdd}
						data-testid="add-condominium-btn"
					>
						<HStack gap="2">
							<LuPlus />
							<Text>{t("condominiums.addNew")}</Text>
						</HStack>
					</Button>
				</Flex>

				{/* Loading State */}
				{loading && condominiums.length === 0 ? (
					<Flex justify="center" align="center" py="12">
						<Spinner size="lg" />
					</Flex>
				) : condominiums.length === 0 ? (
					/* Empty State */
					<Box
						borderWidth="1px"
						borderRadius="lg"
						p={{ base: "6", md: "12" }}
						textAlign="center"
					>
						<Text color="gray.500" mb="4">
							{t("condominiums.noCondominiumsFound")}
						</Text>
						<Button onClick={handleOpenAdd}>
							<LuPlus /> {t("condominiums.addNew")}
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
										<Table.ColumnHeader w="12">
											{t("condominiums.select")}
										</Table.ColumnHeader>
										<Table.ColumnHeader>
											{t("condominiums.name")}
										</Table.ColumnHeader>
										<Table.ColumnHeader>
											{t("condominiums.location")}
										</Table.ColumnHeader>
										<Table.ColumnHeader
											w="20"
											textAlign="right"
										>
											{t("condominiums.actions")}
										</Table.ColumnHeader>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{condominiums.map((item) => {
										const isSelected =
											selectedCondominium?.condominiumId ===
											item.condominiumId;
										return (
											<Table.Row
												key={item.condominiumId}
												bg={
													isSelected
														? "bg.subtle"
														: undefined
												}
												data-testid={`condo-row-${item.condominiumId}`}
											>
												{/* Select column */}
												<Table.Cell>
													<IconButton
														aria-label={
															isSelected
																? t(
																		"condominiums.isActive",
																	)
																: t(
																		"condominiums.select",
																	)
														}
														variant="ghost"
														size="sm"
														disabled={isSelected}
														onClick={() => {
															if (!isSelected) {
																setSelectedCondominium(
																	item,
																);
															}
														}}
														title={
															isSelected
																? t(
																		"condominiums.isActive",
																	)
																: t(
																		"condominiums.select",
																	)
														}
														data-testid={`select-btn-${item.condominiumId}`}
													>
														{isSelected ? (
															<LuCircleCheck color="green" />
														) : (
															<LuCircle />
														)}
													</IconButton>
												</Table.Cell>

												{/* Name column */}
												<Table.Cell fontWeight="medium">
													<HStack gap="2">
														<Text>{item.name}</Text>
														{isSelected && (
															<Badge
																colorPalette="blue"
																size="sm"
															>
																{t(
																	"condominiums.active",
																)}
															</Badge>
														)}
													</HStack>
												</Table.Cell>

												{/* Location / Address column */}
												<Table.Cell color="gray.600">
													{item.address || "-"}
												</Table.Cell>

												{/* Actions column */}
												<Table.Cell textAlign="right">
													<MenuRoot>
														<MenuTrigger asChild>
															<IconButton
																aria-label="Actions"
																variant="ghost"
																size="sm"
																data-testid={`actions-btn-${item.condominiumId}`}
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
																data-testid={`edit-btn-${item.condominiumId}`}
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
																data-testid={`delete-btn-${item.condominiumId}`}
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
										);
									})}
								</Table.Body>
							</Table.Root>
						</Box>

						{/* Mobile Card List View (visible on base / < md) */}
						<Stack display={{ base: "flex", md: "none" }} gap="4">
							{condominiums.map((item) => {
								const isSelected =
									selectedCondominium?.condominiumId ===
									item.condominiumId;
								return (
									<Box
										key={item.condominiumId}
										borderWidth={isSelected ? "2px" : "1px"}
										borderColor={
											isSelected ? "blue.500" : "border"
										}
										borderRadius="md"
										p="4"
										bg={
											isSelected
												? "bg.subtle"
												: "bg.panel"
										}
										data-testid={`condo-card-${item.condominiumId}`}
									>
										<Flex
											justify="space-between"
											align="start"
										>
											<HStack gap="3" align="center">
												<IconButton
													aria-label={
														isSelected
															? t(
																	"condominiums.isActive",
																)
															: t(
																	"condominiums.select",
																)
													}
													variant="ghost"
													size="sm"
													disabled={isSelected}
													onClick={() => {
														if (!isSelected) {
															setSelectedCondominium(
																item,
															);
														}
													}}
												>
													{isSelected ? (
														<LuCircleCheck color="green" />
													) : (
														<LuCircle />
													)}
												</IconButton>
												<Box>
													<HStack gap="2">
														<Text
															fontWeight="bold"
															fontSize="md"
														>
															{item.name}
														</Text>
														{isSelected && (
															<Badge
																colorPalette="blue"
																size="sm"
															>
																{t(
																	"condominiums.active",
																)}
															</Badge>
														)}
													</HStack>
													<Text
														fontSize="sm"
														color="gray.600"
													>
														{item.address || "-"}
													</Text>
												</Box>
											</HStack>

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
															handleOpenEdit(item)
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
								);
							})}
						</Stack>
					</>
				)}
			</Stack>

			{/* Add/Edit Modal */}
			<CondominiumModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				editingCondominium={editingCondo}
			/>

			{/* Delete Confirmation Alert Dialog */}
			<DeleteCondominiumDialog
				open={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				condominium={deletingCondo}
			/>
		</DashboardContainer>
	);
}
