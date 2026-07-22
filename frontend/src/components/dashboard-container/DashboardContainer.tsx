import { Flex, Stack, useDisclosure } from "@chakra-ui/react";
import { type ReactNode } from "react";
import { MobileNavigationDrawer } from "./nav/MobileNavigationDrawer";
import DesktopNavigationSidebar from "./nav/DesktopNavigationSidebar";
import DashboardMainContent from "./main-content/DashboardMainContent";
import { DashboardTopBar } from "./top/DashboardTopBar";
import { DashboardContext } from "@/contexts/DashboardContext";

export function DashboardContainer(props: {
	sidebarBrandName: string;
	sidebarHeading: string;
	topBarTitle: string;
	contentHeaderTitle: string;
	contentHeaderSubtitle: string;
	children: ReactNode;
}) {
	const drawer = useDisclosure();
	return (
		<DashboardContext.Provider
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
					<DashboardTopBar />

					<DashboardMainContent>
						{props.children}
					</DashboardMainContent>
				</Stack>
			</Flex>
		</DashboardContext.Provider>
	);
}
