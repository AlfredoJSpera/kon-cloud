import {
	Box,
	Container,
	Flex,
	Heading,
	HStack,
	Stack,
	Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { ColorModeButton } from "@/components/chakraui/color-mode";

export function AuthContainer(props: {
	brandName: string;
	brandSubtitle: string;
	actionLabel: string;
	actionTitle: string;
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
					{/* Left */}
					<Box
						flex="1"
						p={{ base: "6", md: "10" }}
						borderRightWidth={{ base: "0", lg: "1px" }}
					>
						<Stack gap="6" h="full" justify="space-between">
							<Box>
								<HStack flex="1" justifyContent="space-between">
									<Heading size="3xl" mt="4" maxW="sm">
										{props.brandName}
									</Heading>
									<ColorModeButton variant="ghost" />
								</HStack>

								<Text mt="4" maxW="md" fontSize="lg">
									{props.brandSubtitle}
								</Text>
							</Box>
						</Stack>
					</Box>

					{/* Right */}
					<Box
						flex="0 0 min(100%, 30rem)"
						p={{ base: "6", md: "10" }}
					>
						<Stack gap="6">
							<Box>
								<Text fontSize="sm">{props.actionLabel}</Text>
								<Heading size="2xl" mt="2">
									{props.actionTitle}
								</Heading>
							</Box>
							{props.children}
						</Stack>
					</Box>
				</Flex>
			</Container>
		</Flex>
	);
}
