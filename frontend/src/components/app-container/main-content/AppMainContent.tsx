import { Container, Flex, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AppPageHeader } from "./AppPageHeader";

export default function AppMainContent(props: {
	topBarTitle: string;
	pageHeaderTitle: string;
	pageHeaderSubtitle: string;
	children: ReactNode;
	navigate: ReturnType<typeof useNavigate>;
	drawerOnOpen: () => void;
}) {
	return (
		<Flex
			flex="1"
			px={{ base: "4", md: "6" }}
			py={{ base: "6", md: "8" }}
			justify="center"
		>
			<Container maxW="7xl" px="0">
				<Stack gap="5">
					<AppPageHeader
						title={props.pageHeaderTitle}
						subtitle={props.pageHeaderSubtitle}
					/>
					{props.children}
				</Stack>
			</Container>
		</Flex>
	);
}
