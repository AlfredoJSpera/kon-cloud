import {
	Badge,
	Box,
	Button,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	Separator,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
	LuArrowRight,
	LuChartBar,
	LuBookOpen,
	LuFolderKanban,
	LuShieldCheck,
} from "react-icons/lu";
import { AppContainer } from "@/components/app-container/AppContainer";

export function DashboardPage() {
	const cards = useMemo(
		() => [
			{ title: "Project files", value: "24", icon: LuFolderKanban },
			{ title: "Active sessions", value: "12", icon: LuChartBar },
			{ title: "Shared notes", value: "8", icon: LuBookOpen },
			{ title: "Security checks", value: "99%", icon: LuShieldCheck },
		],
		[],
	);

	return (
		<AppContainer
			topBarTitle="My Extra Long Condominium Name"
			pageHeaderSubtitle="Dashboard preview"
			pageHeaderTitle="Page Layout"
		>
			<Stack gap="6">
				<Box borderWidth="1px" p={{ base: "4", md: "6" }}>
					<Flex
						justify="space-between"
						align="center"
						gap="4"
						wrap="wrap"
					>
						<Box>
							<Text fontSize="sm">Overview Settings</Text>
							<Heading size="lg" mt="1">
								Responsive page layout
							</Heading>
						</Box>
						<Button onClick={() => undefined}>
							Open dashboard
						</Button>
					</Flex>

					<SimpleGrid
						columns={{ base: 1, md: 2, xl: 4 }}
						gap="4"
						mt="6"
					>
						{cards.map((card) => (
							<Box key={card.title} borderWidth="1px" p="4">
								<HStack justify="space-between" align="start">
									<Stack gap="1">
										<Text fontSize="sm">{card.title}</Text>
										<Heading size="xl">
											{card.value}
										</Heading>
									</Stack>
									<Box p="1">
										<Icon as={card.icon} />
									</Box>
								</HStack>
								<Separator my="4" />
								<Text fontSize="sm">
									Placeholder tiles for the dashboard view
									shown in the mockup.
								</Text>
							</Box>
						))}
					</SimpleGrid>
				</Box>

				<SimpleGrid columns={{ base: 1, xl: 2 }} gap="6">
					<Box borderWidth="1px" p="6">
						<Flex justify="space-between" align="center" mb="4">
							<Box>
								<Text fontSize="sm">Primary area</Text>
								<Heading size="md">Content grid</Heading>
							</Box>
							<Badge variant="subtle">Live</Badge>
						</Flex>
						<Grid
							templateColumns="repeat(2, minmax(0, 1fr))"
							gap="4"
						>
							{Array.from({ length: 8 }).map((_, index) => (
								<Box key={index} borderWidth="1px" h="24" />
							))}
						</Grid>
					</Box>

					<Box borderWidth="1px" p="6">
						<Heading size="md" mb="4">
							Quick actions
						</Heading>
						<Stack gap="3">
							{[
								"Open user settings",
								"Review login flow",
								"Switch to registration",
							].map((label) => (
								<Button
									key={label}
									variant="outline"
									justifyContent="space-between"
									onClick={() => undefined}
								>
									<Text>{label}</Text>
									<LuArrowRight />
								</Button>
							))}
						</Stack>
					</Box>
				</SimpleGrid>
			</Stack>
		</AppContainer>
	);
}
