import { Button, HStack, Text } from "@chakra-ui/react";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuSeparator,
	MenuTrigger,
} from "@/components/chakraui/menu";
import { useCondominium } from "@/hooks/useCondominium";
import { LuChevronDown, LuBuilding, LuPlus } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function CondominiumSelector() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { condominiums, selectedCondominium, setSelectedCondominium } =
		useCondominium();

	const label =
		selectedCondominium?.name || t("condominiums.selectCondominium");

	return (
		<MenuRoot>
			<MenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					data-testid="condominium-selector-dropdown"
				>
					<HStack gap="2">
						<LuBuilding />
						<Text maxW={{ base: "140px", md: "240px" }} truncate>
							{label}
						</Text>
						<LuChevronDown />
					</HStack>
				</Button>
			</MenuTrigger>

			<MenuContent>
				{condominiums.length === 0 ? (
					<MenuItem value="none" disabled>
						{t("condominiums.noCondominiumsFound")}
					</MenuItem>
				) : (
					condominiums.map((c) => (
						<MenuItem
							key={c.condominiumId}
							value={String(c.condominiumId)}
							onClick={() => setSelectedCondominium(c)}
							fontWeight={
								selectedCondominium?.condominiumId === c.condominiumId
									? "bold"
									: "normal"
							}
							data-testid={`select-condo-${c.condominiumId}`}
						>
							<HStack justify="space-between" w="full">
								<Text truncate>{c.name}</Text>
								{selectedCondominium?.condominiumId ===
									c.condominiumId && (
									<Text fontSize="xs" color="blue.500">
										✓
									</Text>
								)}
							</HStack>
						</MenuItem>
					))
				)}
				<MenuSeparator />
				<MenuItem
					value="manage-condos"
					onClick={() => navigate("/condominiums")}
					data-testid="manage-condos-option"
				>
					<HStack gap="2">
						<LuPlus />
						<Text>{t("condominiums.title")}</Text>
					</HStack>
				</MenuItem>
			</MenuContent>
		</MenuRoot>
	);
}
