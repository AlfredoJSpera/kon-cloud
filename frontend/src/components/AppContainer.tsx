import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	HStack,
	IconButton,
	Stack,
	Text,
	useDisclosure,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LuMenu } from "react-icons/lu";
import { Avatar } from "@/components/ui/avatar";
import {
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuSeparator,
	MenuTrigger,
} from "@/components/ui/menu";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Sidebar } from "./Sidebar";

export function AppContainer(props: {
	title: string;
	subtitle: string;
	children: ReactNode;
}) {
	const navigate = useNavigate();
	const drawer = useDisclosure();

	return (
		<Flex minH="100svh" position="relative">
			<Box
				display={{ base: "none", lg: "block" }}
				w="18rem"
				borderRightWidth="1px"
				px="5"
				py="6"
			>
				<Sidebar navigate={navigate} />
			</Box>

			<Stack flex="1" gap="0">
				<Flex
					align="center"
					justify="space-between"
					px={{ base: "4", md: "6" }}
					py="4"
					borderBottomWidth="1px"
				>
					<HStack gap="3">
						<IconButton
							aria-label="Open navigation"
							size="sm"
							variant="ghost"
							display={{ base: "inline-flex", lg: "none" }}
							onClick={drawer.onOpen}
						>
							<LuMenu />
						</IconButton>
						<Box>
							<Text fontSize="xs">Kon-Cloud</Text>
							<Heading size="md">{props.title}</Heading>
						</Box>
					</HStack>

					<HStack gap="2">
						<ColorModeButton variant="ghost" />
						<MenuRoot positioning={{ placement: "bottom-end" }}>
							<MenuTrigger asChild>
								<Button variant="ghost" px="2" py="1">
									<HStack gap="2">
										<Avatar name="User Avatar" size="xs" />
										<Text fontSize="sm">User menu</Text>
									</HStack>
								</Button>
							</MenuTrigger>
							<MenuContent>
								<MenuItem
									value="profile"
									onClick={() => navigate("/settings")}
								>
									Profile
								</MenuItem>
								<MenuItem
									value="settings"
									onClick={() => navigate("/settings")}
								>
									User settings
								</MenuItem>
								<MenuSeparator />
								<MenuItem
									value="logout"
									onClick={() => navigate("/login")}
								>
									Logout
								</MenuItem>
							</MenuContent>
						</MenuRoot>
					</HStack>
				</Flex>

				<Flex
					flex="1"
					px={{ base: "4", md: "6" }}
					py={{ base: "5", md: "8" }}
					justify="center"
				>
					<Container maxW="7xl" px="0">
						<Stack gap="5">
							<Box>
								<Text fontSize="sm">{props.subtitle}</Text>
								<Heading size="2xl" mt="2">
									{props.title}
								</Heading>
							</Box>
							{props.children}
						</Stack>
					</Container>
				</Flex>
			</Stack>

			<DrawerRoot
				open={drawer.open}
				onOpenChange={(details) => drawer.setOpen(details.open)}
				placement="start"
			>
				<DrawerContent borderRightWidth="1px">
					<DrawerCloseTrigger />
					<DrawerHeader>
						<DrawerTitle>Navigation</DrawerTitle>
					</DrawerHeader>
					<DrawerBody>
						<Sidebar navigate={navigate} />
					</DrawerBody>
				</DrawerContent>
			</DrawerRoot>
		</Flex>
	);
}
