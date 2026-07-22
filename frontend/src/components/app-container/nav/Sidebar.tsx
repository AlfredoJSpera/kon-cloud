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
	LuLock,
	LuSettings2,
	LuSparkles,
	LuTestTube,
} from "react-icons/lu";
import { AppContext } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";

type NavItem = {
	label: string;
	path: string;
	icon: ReactNode;
};

const navItems: NavItem[] = [
	{ label: "Page Layout", path: "/", icon: <Icon as={LuGrid2X2} /> },
	{ label: "Login", path: "/login", icon: <Icon as={LuLock} /> },
	{
		label: "Registration",
		path: "/register",
		icon: <Icon as={LuSparkles} />,
	},
	{
		label: "User Settings",
		path: "/settings",
		icon: <Icon as={LuSettings2} />,
	},
	{
		label: "Manual Testing",
		path: "/manualtest",
		icon: <Icon as={LuTestTube} />,
	},
];

export function Sidebar() {
	const ctx = useContext(AppContext);
	const navigate = useNavigate();

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
						variant="ghost"
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
