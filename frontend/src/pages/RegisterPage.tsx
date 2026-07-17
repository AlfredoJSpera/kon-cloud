import { Button, Input, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthFrame } from "@/components/AuthFrame";
import { useState } from "react";

export function RegisterPage() {
	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [email, setEmail] = useState("");
	const [repeatEmail, setRepeatEmail] = useState("");
	const [password, setPassword] = useState("");
	const [repeatPassword, setRepeatPassword] = useState("");

	return (
		<AuthFrame
			title="Register to Kon-Cloud"
			subtitle="Create a profile with your details."
			actionLabel="Create account"
		>
			<Stack
				gap="4"
				as="form"
				onSubmit={(e) => {
					e.preventDefault();
					console.log("login:", {
						name,
						surname,
						email,
						repeatEmail,
						password,
						repeatPassword,
					});
				}}
			>
				{/* Basic info */}

				<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
					<Field label="Name">
						<Input
							placeholder="Jane"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</Field>
					<Field label="Surname">
						<Input
							placeholder="Doe"
							value={surname}
							onChange={(e) => setSurname(e.target.value)}
						/>
					</Field>
				</SimpleGrid>

				{/* Email */}

				<Field label="Email">
					<Input
						placeholder="name@company.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Field>
				<Field label="Repeat email">
					<Input
						placeholder="name@company.com"
						value={repeatEmail}
						onChange={(e) => setRepeatEmail(e.target.value)}
					/>
				</Field>

				{/* Password */}

				<Field label="Password">
					<PasswordInput
						placeholder="Create a password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Field>
				<Field label="Repeat password">
					<PasswordInput
						placeholder="Repeat the password"
						value={repeatPassword}
						onChange={(e) => setRepeatPassword(e.target.value)}
					/>
				</Field>

				{/* Submit */}

				<Button type="submit" size="lg">
					Register
				</Button>

				{/* Link to login */}

				<Text fontSize="sm" textAlign="center">
					<Link asChild>
						<RouterLink to="/login">
							Already have an account? Log in here.
						</RouterLink>
					</Link>
				</Text>
			</Stack>
		</AuthFrame>
	);
}
