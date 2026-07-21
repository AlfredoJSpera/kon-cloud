import { Flex, Stack, useDisclosure } from "@chakra-ui/react";
import { type ReactNode } from "react";
import { MobileNavigationDrawer } from "./nav/MobileNavigationDrawer";
import DesktopNavigationSidebar from "./nav/DesktopNavigationSidebar";
import AppMainContent from "./main-content/AppMainContent";
import { AppTopBar } from "./top/AppTopBar";
import { AppContext } from "./AppContext";

export function AppContainer(props: {
	sidebarBrandName: string;
	sidebarHeading: string;
	topBarTitle: string;
	contentHeaderTitle: string;
	contentHeaderSubtitle: string;
	children: ReactNode;
}) {
	const drawer = useDisclosure();
	return (
		<AppContext
			value={{
				drawer,
				sidebarBrandName: props.sidebarBrandName,
				sidebarHeading: props.sidebarHeading,
				topBarTitle: props.topBarTitle,
				contentHeaderSubtitle: props.contentHeaderSubtitle,
				contentHeaderTitle: props.contentHeaderTitle,
			}}
		>
			<Flex minH="100svh" position="relative">
				<DesktopNavigationSidebar />
				<MobileNavigationDrawer />

				<Stack flex="1" gap="0">
					<AppTopBar />

					<AppMainContent>{props.children}</AppMainContent>
				</Stack>
			</Flex>
		</AppContext>
	);
}
