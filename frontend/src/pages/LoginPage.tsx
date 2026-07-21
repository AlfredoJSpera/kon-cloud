import { Button, Input, Link, Separator, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthContainer } from "@/components/AuthContainer";
import { loginUrl } from "@/api/apiUrls";
import { type IErrorResponse } from "@backend-interfaces/common";
import {
	type IAuthLoginInput,
	type IAuthLoginOutput,
} from "@backend-interfaces/auth";
import { toaster } from "@/components/ui/toaster";
import handleApiError from "@/api/apiErrorHandler";

export function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState({
		email: false,
		password: false,
	});
	const navigate = useNavigate();

	const handleLogin = async (e: React.SubmitEvent<HTMLDivElement>) => {
		e.preventDefault();
		setFieldErrors({ email: false, password: false });
		setIsLoading(true);

		try {
			if (!email || !password) {
				// Set errors if fields are empty
				setFieldErrors({ email: !email, password: !password });
				throw new Error("MISSING_REQUIRED_FIELDS");
			}

			const input: IAuthLoginInput = {
				email,
				password,
			};

			const response = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(input),
			});

			const data = await response.json();

			if (!response.ok) {
				const errorData = data as IErrorResponse;
				throw new Error(errorData.errorCode);
			}

			const responseData = data as IAuthLoginOutput;

			//TODO: Change localStorage for a React Context
			localStorage.setItem("accessToken", responseData.accessToken);
			localStorage.setItem("csrfToken", responseData.csrfToken);
			localStorage.setItem(
				"userProfile",
				JSON.stringify(responseData.profile),
			);

			toaster.create({
				title: "You are now logged in.",
				type: "success",
			});

			navigate("/dashboard");
		} catch (err: unknown) {
			console.error("Login error:", err);

			const errorMessage =
				err instanceof Error
					? handleApiError(err.message)
					: "Something went wrong.";

			toaster.create({
				title: errorMessage,
				type: "error",
			});
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
			<Stack gap="4" as="form" onSubmit={handleLogin}>
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
