import { Flex, HStack, Button, Text, IconButton } from "@chakra-ui/react";
import { Avatar } from "@/components/chakraui/avatar";
import {
	ColorModeButton,
	useColorMode,
} from "@/components/chakraui/color-mode";
import {
	MenuRoot,
	MenuTrigger,
	MenuContent,
	MenuItem,
	MenuSeparator,
} from "@/components/chakraui/menu";
import { useContext } from "react";
import { DashboardContext } from "@/contexts/DashboardContext";
import { useAuth } from "@/hooks/useAuth";
import { LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./LanguageSelector";
import { CondominiumSelector } from "./CondominiumSelector";

export function DashboardTopBar() {
	const { t } = useTranslation();
	const { colorMode, toggleColorMode } = useColorMode();
	const navigate = useNavigate();
	const dashCtx = useContext(DashboardContext);
	const { user, logout } = useAuth();
	const userNameSurname = user
		? `${user.firstName} ${user.lastName}`
		: t("topbar.administrator");

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
				<CondominiumSelector />
			</HStack>

			{/* Right */}
			<HStack gap="2">
				<LanguageSelector />

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
					onClick={dashCtx?.drawer.onOpen}
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
							value="toggle-color"
							onClick={() => toggleColorMode()}
							display={{
								base: "inline-flex",
								md: "none",
							}}
						>
							{colorMode === "light"
								? t("topbar.darkMode")
								: t("topbar.lightMode")}
						</MenuItem>

						<MenuItem
							value="settings"
							onClick={() => navigate("/settings")}
						>
							{t("topbar.settings")}
						</MenuItem>

						<MenuSeparator />

						<MenuItem
							value="logout"
							onClick={async () => {
								await logout();
								navigate("/login");
							}}
						>
							{t("topbar.logout")}
						</MenuItem>
					</MenuContent>
				</MenuRoot>
			</HStack>
		</Flex>
	);
}
