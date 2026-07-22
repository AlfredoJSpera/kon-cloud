import {
	Flex,
	HStack,
	Heading,
	Button,
	Text,
	IconButton,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { ColorModeButton, useColorMode } from "@/components/ui/color-mode";
import {
	MenuRoot,
	MenuTrigger,
	MenuContent,
	MenuItem,
	MenuSeparator,
} from "@/components/ui/menu";
import { useContext } from "react";
import { AppContext } from "@/contexts/AppContext";
import { LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export function AppTopBar() {
	const { colorMode, toggleColorMode } = useColorMode();
	const navigate = useNavigate();
	const appCtx = useContext(AppContext);
	const userNameSurname = "Name Surname";

	return (
		<Flex
			align="center"
			justify="space-between"
			px={{ base: "4", md: "6" }}
			py="4"
			borderBottomWidth="1px"
		>
			{/* Left */}
			<HStack gap="3">
				<Heading size="md">{appCtx?.topBarTitle}</Heading>
			</HStack>

			{/* Right */}
			<HStack gap="2">
				<ColorModeButton
					display={{ base: "none", md: "inline-flex" }}
					variant="ghost"
				/>

				{/* OpenDrawerButton: appears when <= md */}
				<IconButton
					aria-label="Open navigation"
					size="sm"
					variant="ghost"
					display={{ base: "inline-flex", lg: "none" }}
					onClick={appCtx?.drawer.onOpen}
				>
					<LuMenu />
				</IconButton>

				<MenuRoot>
					{/* Menu button */}
					<MenuTrigger asChild>
						<Button variant="ghost" px="2" py="1">
							<HStack gap="2">
								<Avatar name={userNameSurname} size="xs" />
								<Text
									display={{
										base: "none",
										md: "inline-flex",
									}}
									fontSize="sm"
								>
									{userNameSurname}
								</Text>
							</HStack>
						</Button>
					</MenuTrigger>

					{/* Menu items */}
					<MenuContent>
						<MenuItem
							value="profile"
							onClick={() => navigate("/profile")}
						>
							Profile
						</MenuItem>

						<MenuItem
							value="toggle-color"
							onClick={() => toggleColorMode()}
							display={{
								base: "inline-flex",
								md: "none",
							}}
						>
							{colorMode === "light" ? "Dark mode" : "Light mode"}
						</MenuItem>

						<MenuItem
							value="settings"
							onClick={() => navigate("/settings")}
						>
							Settings
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
	);
}
