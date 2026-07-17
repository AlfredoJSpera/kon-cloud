import {
	Box,
	Button,
	Heading,
	HStack,
	Icon,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuGrid2X2, LuLock, LuSettings2, LuSparkles } from "react-icons/lu";

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
];

export function Sidebar(props: { navigate: (path: string) => void }) {
	return (
		<Stack gap="6" h="full">
			<Box>
				<Text fontSize="xs">Kon-Cloud</Text>
				<Heading size="lg" mt="1">
					Side Navigation
				</Heading>
			</Box>
			<Stack gap="2">
				{navItems.map((item) => (
					<Button
						key={item.path}
						justifyContent="flex-start"
						variant="ghost"
						onClick={() => props.navigate(item.path)}
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
