import { Button, Input, Link, Separator, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthContainer } from "@/components/AuthContainer";

export function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<AuthContainer
			title="Login to Kon-Cloud"
			subtitle="Use your account email and password to continue."
			actionLabel="Sign in"
		>
			<Stack
				gap="4"
				as="form"
				onSubmit={(e) => {
					e.preventDefault();
					console.log("login:", { email, password });
				}}
			>
				{/* Login info */}

				<Field label="Email address">
					<Input
						placeholder="name@company.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Field>
				<Field label="Password">
					<PasswordInput
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</Field>

				{/* Submit */}

				<Button type="submit" size="lg">
					Login
				</Button>

				{/* Registration link */}

				<Text fontSize="sm" textAlign="center">
					<Link asChild>
						<RouterLink to="/register">
							Need an account? Register here.
						</RouterLink>
					</Link>
				</Text>

				{/* OAuth links */}

				<Separator />
				<Stack gap="3">
					<Button variant="outline" justifyContent="space-between">
						<Text>Continue with Microsoft</Text>
						<LuArrowRight />
					</Button>
					<Button variant="outline" justifyContent="space-between">
						<Text>Continue with GitHub</Text>
						<LuArrowRight />
					</Button>
				</Stack>
			</Stack>
		</AuthContainer>
	);
}
