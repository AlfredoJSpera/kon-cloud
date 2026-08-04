import { Button, Input, Link, Separator, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { Field } from "@/components/chakraui/field";
import { PasswordInput } from "@/components/chakraui/password-input";
import { AuthContainer } from "@/components/AuthContainer";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export function LoginPage() {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState({
		email: false,
		password: false,
	});

	const navigate = useNavigate();
	const authCtx = useAuth();

	const handleSubmit = async (e: React.SubmitEvent<HTMLDivElement>) => {
		e.preventDefault();
		setFieldErrors({ email: false, password: false });

		if (!email || !password) {
			setFieldErrors({ email: !email, password: !password });
			return;
		}

		setIsLoading(true);

		try {
			await authCtx.login({ email, password });
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
			brandSubtitle={t("login.brandSubtitle")}
			actionLabel={t("login.actionLabel")}
			actionTitle={t("login.actionTitle")}
		>
			<Stack gap="4" as="form" onSubmit={handleSubmit}>
				<Field
					label={t("login.emailLabel")}
					invalid={fieldErrors.email}
					errorText={t("login.fieldRequired")}
				>
					<Input
						placeholder={t("login.emailPlaceholder")}
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
					label={t("login.passwordLabel")}
					invalid={fieldErrors.password}
					errorText={t("login.fieldRequired")}
				>
					<PasswordInput
						placeholder={t("login.passwordPlaceholder")}
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
					{t("login.submitButton")}
				</Button>

				<Text fontSize="sm" textAlign="center">
					<Link asChild>
						<RouterLink to="/register">
							{t("login.needAccount")}
						</RouterLink>
					</Link>
				</Text>

				<Separator />
				<Stack gap="3">
					<Button variant="outline" justifyContent="space-between">
						<Text>{t("login.continueMicrosoft")}</Text>
						<LuArrowRight />
					</Button>
					<Button variant="outline" justifyContent="space-between">
						<Text>{t("login.continueGithub")}</Text>
						<LuArrowRight />
					</Button>
				</Stack>
			</Stack>
		</AuthContainer>
	);
}

