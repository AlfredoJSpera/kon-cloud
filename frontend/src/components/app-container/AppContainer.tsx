import { Flex, Stack, useDisclosure } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MobileNavigationDrawer } from "./nav/MobileNavigationDrawer";
import DesktopNavigationSidebar from "./nav/DesktopNavigationSidebar";
import AppMainContent from "./main-content/AppMainContent";
import { AppTopBar } from "./top/AppTopBar";

export function AppContainer(props: {
	topBarTitle: string;
	pageHeaderTitle: string;
	subtitle: string;
	children: ReactNode;
}) {
	const navigate = useNavigate();
	const drawer = useDisclosure();

	const brandName = "Kon-Cloud";
	const heading = "Side Navigation";

	return (
		<Flex minH="100svh" position="relative">
			<DesktopNavigationSidebar
				brandName={brandName}
				heading={heading}
				navigate={navigate}
			/>
			<MobileNavigationDrawer
				brandName={brandName}
				heading={heading}
				drawerOpen={drawer.open}
				drawerSetOpen={drawer.setOpen}
				navigate={navigate}
			/>

			<Stack flex="1" gap="0">
				<AppTopBar
					user={{ name: "Name", surname: "Surname" }}
					title={props.topBarTitle}
					drawerOnOpen={drawer.onOpen}
					navigate={navigate}
				/>

				<AppMainContent
					topBarTitle={props.topBarTitle}
					pageHeaderTitle={props.pageHeaderTitle}
					pageHeaderSubtitle={props.subtitle}
					navigate={navigate}
					drawerOnOpen={drawer.onOpen}
				>
					{props.children}
				</AppMainContent>
			</Stack>
		</Flex>
	);
}
