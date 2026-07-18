import { Flex, HStack, Heading, Button, Text } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { ColorModeButton, useColorMode } from "@/components/ui/color-mode";
import {
	MenuRoot,
	MenuTrigger,
	MenuContent,
	MenuItem,
	MenuSeparator,
} from "@/components/ui/menu";
import OpenDrawerButton from "./OpenDrawerButton";

export function AppTopBar(props: {
	title: string;
	user: {
		name: string;
		surname: string;
	};
	drawerOnOpen: () => void;
	navigate: (path: string) => void;
}) {
	const { colorMode, toggleColorMode } = useColorMode();
	const userNameSurname = `${props.user.name} ${props.user.surname}`;

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
				{/* Button appears when <= md */}
				<OpenDrawerButton drawerOnOpen={props.drawerOnOpen} />

				<Heading size="md">{props.title}</Heading>
			</HStack>

			{/* Right */}
			<HStack gap="2">
				<ColorModeButton
					display={{ base: "none", md: "inline-flex" }}
					variant="ghost"
				/>

				<MenuRoot>
					{/* Menu button */}
					<MenuTrigger asChild>
						<Button variant="ghost" px="2" py="1">
							<HStack gap="2">
								<Avatar name={userNameSurname} size="xs" />
								<Text fontSize="sm">{userNameSurname}</Text>
							</HStack>
						</Button>
					</MenuTrigger>

					{/* Menu items */}
					<MenuContent>
						<MenuItem
							value="profile"
							onClick={() => props.navigate("/profile")}
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
							onClick={() => props.navigate("/settings")}
						>
							Settings
						</MenuItem>

						<MenuSeparator />

						<MenuItem
							value="logout"
							onClick={() => props.navigate("/login")}
						>
							Logout
						</MenuItem>
					</MenuContent>
				</MenuRoot>
			</HStack>
		</Flex>
	);
}
