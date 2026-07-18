import { Box, Heading, Text } from "@chakra-ui/react";

export function AppPageHeader(props: { title: string; subtitle: string }) {
	return (
		<Box>
			<Text fontSize="sm">{props.subtitle}</Text>
			<Heading size="2xl" mt="2">
				{props.title}
			</Heading>
		</Box>
	);
}
