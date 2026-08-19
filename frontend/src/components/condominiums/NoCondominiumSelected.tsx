import { Button, Flex, Heading, HStack, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuBuilding } from "react-icons/lu";

export interface NoCondominiumSelectedProps {
	description?: string;
}

export function NoCondominiumSelected({ description }: NoCondominiumSelectedProps = {}) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
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
			<Icon as={LuBuilding} boxSize="12" color="gray.400" mb="4" />
			<Heading size="xl" mb="2">
				{t("dashboard.noCondominiumSelected")}
			</Heading>
			<Text color="gray.500" mb="6" maxW="md">
				{description || t("dashboard.selectOrCreateFromCondominiumsPage")}
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
	);
}
