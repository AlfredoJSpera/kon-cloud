import {
	Box,
	Button,
	Heading,
	HStack,
	Input,
	Separator,
	SimpleGrid,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/chakraui/avatar";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { AppContainer } from "@/components/app-container/AppContainer";

export function SettingsPage() {
	const [email, setEmail] = useState("alex@kon-cloud.dev");
	const navigate = useNavigate();

	return (
		<AppContainer
			sidebarBrandName="Kon-Cloud"
			sidebarHeading="Navigation"
			topBarTitle=""
			contentHeaderSubtitle="User Settings"
			contentHeaderTitle="Profile and security controls"
		>
			<SimpleGrid columns={{ base: 1, xl: 3 }} gap="6">
				<Box
					borderWidth="1px"
					p="6"
					gridColumn={{ base: "auto", xl: "span 1" }}
				>
					<Stack gap="4" align="center" textAlign="center">
						<Avatar name="Alex Morgan" size="2xl" />
						<Box>
							<Heading size="lg">Alex Morgan</Heading>
							<Text>Product designer</Text>
						</Box>
						<Text fontSize="sm">
							Upload a photo, update contact details, and manage
							account security from one place.
						</Text>
						<Button variant="outline" width="full">
							Upload new picture
						</Button>
					</Stack>
				</Box>

				<Box
					borderWidth="1px"
					p="6"
					gridColumn={{ base: "auto", xl: "span 2" }}
				>
					<Stack gap="6">
						<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
							<Field label="Name">
								<Input placeholder="Alex" />
							</Field>
							<Field label="Surname">
								<Input placeholder="Morgan" />
							</Field>
							<Field label="Email">
								<Input
									value={email}
									onChange={(event) =>
										setEmail(event.target.value)
									}
								/>
							</Field>
							<Field label="New Email">
								<Input placeholder="new.email@company.com" />
							</Field>
						</SimpleGrid>

						<Separator />

						<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
							<Field label="Password">
								<PasswordInput placeholder="Current password" />
							</Field>
							<Field label="New password">
								<PasswordInput placeholder="New password" />
							</Field>
							<Field label="Two-factor code">
								<Input placeholder="000000" />
							</Field>
							<Field label="Account status">
								<Input value="Verified" readOnly />
							</Field>
						</SimpleGrid>

						<HStack justify="flex-end" gap="3">
							<Button
								variant="outline"
								onClick={() => navigate("/")}
							>
								Cancel
							</Button>
							<Button>Save changes</Button>
						</HStack>
					</Stack>
				</Box>
			</SimpleGrid>
		</AppContainer>
	);
}
