import { Box, Heading, Text, Container, Flex, Stack } from "@chakra-ui/react";
import { useContext, type ReactNode } from "react";
import { AppContext } from "../AppContext";

export default function AppMainContent(props: { children: ReactNode }) {
	const ctx = useContext(AppContext);
	return (
		<Flex
			flex="1"
			px={{ base: "4", md: "6" }}
			py={{ base: "6", md: "8" }}
			justify="center"
		>
			<Container maxW="7xl" px="0">
				<Stack gap="5">
					{/* Page Header */}
					<Box>
						<Text fontSize="sm">{ctx?.contentHeaderSubtitle}</Text>
						<Heading size="2xl" mt="2">
							{ctx?.contentHeaderTitle}
						</Heading>
					</Box>

					{/* Content */}
					{props.children}
				</Stack>
			</Container>
		</Flex>
	);
}
