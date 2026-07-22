import { Button, Input, Link, Separator, Stack, Text } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { AuthContainer } from "@/components/AuthContainer";
import { AuthContext } from "@/contexts/AuthContext";

export function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState({
		email: false,
		password: false,
	});

	const navigate = useNavigate();
	const authCtx = useContext(AuthContext);

	const handleSubmit = async (e: React.SubmitEvent<HTMLDivElement>) => {
		e.preventDefault();
		setFieldErrors({ email: false, password: false });

		if (!email || !password) {
			setFieldErrors({ email: !email, password: !password });
			return;
		}

		setIsLoading(true);

		try {
			await authCtx?.login({ email, password });
			navigate("/dashboard");
		} catch {
			// Error toasts and logging are already handled by AuthProvider
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContainer
			brandName="Kon-Cloud"
			brandSubtitle="Use your account email and password to continue."
			actionLabel="Sign in"
			actionTitle="Login to Kon-Cloud"
		>
			<Stack gap="4" as="form" onSubmit={handleSubmit}>
				<Field
					label="Email address"
					invalid={fieldErrors.email}
					errorText="This field is required"
				>
					<Input
						placeholder="name@company.com"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							if (e.target.value)
								setFieldErrors((prev) => ({
									...prev,
									email: false,
								}));
						}}
						disabled={isLoading}
					/>
				</Field>
				<Field
					label="Password"
					invalid={fieldErrors.password}
					errorText="This field is required"
				>
					<PasswordInput
						placeholder="Enter your password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (e.target.value)
								setFieldErrors((prev) => ({
									...prev,
									password: false,
								}));
						}}
						disabled={isLoading}
					/>
				</Field>

				<Button
					type="submit"
					size="lg"
					loading={isLoading}
					disabled={isLoading}
				>
					Login
				</Button>

				<Text fontSize="sm" textAlign="center">
					<Link asChild>
						<RouterLink to="/register">
							Need an account? Register here.
						</RouterLink>
					</Link>
				</Text>

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
