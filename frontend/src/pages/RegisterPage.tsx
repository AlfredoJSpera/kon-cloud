import { Button, Input, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { AuthContainer } from "@/components/AuthContainer";
import { toaster } from "@/components/chakraui/toaster";
import getApiErrorMessage from "@/api/apiErrorMessages";
import { isAxiosError } from "axios";
import { makeApiRequest } from "@/api/api";
import { useAuth } from "@/hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
	const { isSessionRestoring } = useAuth();
	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [email, setEmail] = useState("");
	const [repeatEmail, setRepeatEmail] = useState("");
	const [password, setPassword] = useState("");
	const [repeatPassword, setRepeatPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const navigate = useNavigate();
	const isFormDisabled = isLoading || isSessionRestoring;

	const isEmailValid = !email || EMAIL_REGEX.test(email);
	const isPasswordValid = !password || password.length >= 8;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name || !surname || !email || !password) {
			toaster.create({
				title: "Validation error",
				description: "Please fill in all required fields.",
				type: "error",
			});
			return;
		}

		if (!EMAIL_REGEX.test(email)) {
			toaster.create({
				title: "Validation error",
				description: "Please enter a valid email address.",
				type: "error",
			});
			return;
		}

		if (email !== repeatEmail) {
			toaster.create({
				title: "Validation error",
				description: "Email addresses do not match.",
				type: "error",
			});
			return;
		}

		if (password.length < 8) {
			toaster.create({
				title: "Validation error",
				description: "Password must be at least 8 characters long.",
				type: "error",
			});
			return;
		}

		if (password !== repeatPassword) {
			toaster.create({
				title: "Validation error",
				description: "Passwords do not match.",
				type: "error",
			});
			return;
		}

		setIsLoading(true);

		try {
			await makeApiRequest.administrators.register({
				firstName: name.trim(),
				lastName: surname.trim(),
				email,
				password,
			});

			toaster.create({
				title: "Registration successful",
				description: "You can now log in.",
				type: "success",
			});
			navigate("/login");
		} catch (err: unknown) {
			let errorCode = "UNKNOWN";
			if (isAxiosError(err)) {
				errorCode = err.response?.data?.errorCode ?? "UNKNOWN";
			}
			toaster.create({
				title: "Registration failed",
				description: getApiErrorMessage(errorCode),
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContainer
			brandName="Kon-Cloud"
			brandSubtitle="Create a profile with your details."
			actionLabel="Create account"
			actionTitle="Register to Kon-Cloud"
		>
			<Stack gap="4" as="form" onSubmit={handleSubmit}>
				{/* Basic info */}
				<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
					<Field label="Name" required>
						<Input
							placeholder="Jane"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isFormDisabled}
						/>
					</Field>
					<Field label="Surname" required>
						<Input
							placeholder="Doe"
							value={surname}
							onChange={(e) => setSurname(e.target.value)}
							disabled={isFormDisabled}
						/>
					</Field>
				</SimpleGrid>

				{/* Email */}
				<Field
					label="Email"
					required
					invalid={!isEmailValid}
					errorText="Please enter a valid email address"
				>
					<Input
						type="email"
						placeholder="name@company.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={isFormDisabled}
					/>
				</Field>
				<Field
					label="Repeat email"
					required
					invalid={Boolean(repeatEmail && email !== repeatEmail)}
					errorText="Email addresses do not match"
				>
					<Input
						type="email"
						placeholder="name@company.com"
						value={repeatEmail}
						onChange={(e) => setRepeatEmail(e.target.value)}
						disabled={isFormDisabled}
					/>
				</Field>

				{/* Password */}
				<Field
					label="Password"
					required
					invalid={!isPasswordValid}
					errorText="Password must be at least 8 characters long"
				>
					<PasswordInput
						placeholder="Create a password (min. 8 characters)"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={isFormDisabled}
					/>
				</Field>
				<Field
					label="Repeat password"
					required
					invalid={Boolean(
						repeatPassword && password !== repeatPassword,
					)}
					errorText="Passwords do not match"
				>
					<PasswordInput
						placeholder="Repeat the password"
						value={repeatPassword}
						onChange={(e) => setRepeatPassword(e.target.value)}
						disabled={isFormDisabled}
					/>
				</Field>

				{/* Submit */}
				<Button
					type="submit"
					size="lg"
					loading={isFormDisabled}
					disabled={isFormDisabled}
				>
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
		</AuthContainer>
	);
}
