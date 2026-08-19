import {
	Box,
	Button,
	Heading,
	HStack,
	Icon,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useContext, type ReactNode } from "react";
import {
	LuGrid2X2,
	LuBuilding,
	LuUsers,
	LuReceipt,
	LuWallet,
} from "react-icons/lu";
import { DashboardContext } from "@/contexts/DashboardContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

type NavItem = {
	label: string;
	path: string;
	icon: ReactNode;
};

export function Sidebar() {
	const { t } = useTranslation();
	const ctx = useContext(DashboardContext);
	const navigate = useNavigate();
	const location = useLocation();

	const navItems: NavItem[] = [
		{
			label: t("condominiums.title"),
			path: "/condominiums",
			icon: <Icon as={LuBuilding} />,
		},
		{
			label: "Dashboard",
			path: "/",
			icon: <Icon as={LuGrid2X2} />,
		},
		{
			label: t("tenants.title"),
			path: "/tenants",
			icon: <Icon as={LuUsers} />,
		},
		{
			label: t("dues.title"),
			path: "/dues",
			icon: <Icon as={LuReceipt} />,
		},
		{
			label: t("expenses.title"),
			path: "/expenses",
			icon: <Icon as={LuWallet} />,
		},
	];

	return (
		<Stack gap="6" h="full">
			{/* Headings */}
			<Box>
				<Text fontSize="xs">{ctx?.sidebarBrandName}</Text>
				<Heading size="lg" mt="1">
					{ctx?.sidebarHeading}
				</Heading>
			</Box>

			{/* Navigation items */}
			<Stack gap="2">
				{navItems.map((item) => (
					<Button
						key={item.path}
						justifyContent="flex-start"
						variant={
							location.pathname === item.path ? "subtle" : "ghost"
						}
						onClick={() => navigate(item.path)}
					>
						<HStack gap="3">
							{item.icon}
							<Text>{item.label}</Text>
						</HStack>
					</Button>
				))}
			</Stack>
		</Stack>
	);
}
