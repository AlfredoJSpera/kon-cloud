import { Box, Container, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ColorModeButton } from "@/components/ui/color-mode";

export function AuthFrame(props: {
	title: string;
	subtitle: string;
	actionLabel: string;
	children: ReactNode;
}) {
	return (
		<Flex minH="100svh" position="relative">
			<Container
				maxW="7xl"
				px={{ base: "4", md: "8" }}
				py={{ base: "4", md: "8" }}
			>
				<Flex
					minH={{ base: "auto", lg: "calc(100svh - 4rem)" }}
					borderWidth="1px"
					direction={{ base: "column", lg: "row" }}
				>
					<Box
						flex="1"
						p={{ base: "6", md: "10" }}
						borderRightWidth={{ base: "0", lg: "1px" }}
					>
						<Stack gap="6" h="full" justify="space-between">
							<Box>
								<Heading size="3xl" mt="4" maxW="sm">
									Kon-Cloud
								</Heading>
								<Text mt="4" maxW="md" fontSize="lg">
									{props.subtitle}
								</Text>
							</Box>
						</Stack>
					</Box>

					<Box
						flex="0 0 min(100%, 30rem)"
						p={{ base: "6", md: "10" }}
					>
						<Stack gap="6">
							<Box>
								<Text fontSize="sm">{props.actionLabel}</Text>
								<Heading size="2xl" mt="2">
									{props.title}
								</Heading>
							</Box>
							{props.children}
						</Stack>
					</Box>
				</Flex>
			</Container>
			<Box position="absolute" top="4" right="4">
				<ColorModeButton variant="ghost" />
			</Box>
		</Flex>
	);
}
