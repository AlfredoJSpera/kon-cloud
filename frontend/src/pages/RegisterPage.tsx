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
import { useTranslation } from "react-i18next";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
	const { t } = useTranslation();
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
				title: t("register.validationErrorTitle"),
				description: t("register.fillRequiredFields"),
				type: "error",
			});
			return;
		}

		if (!EMAIL_REGEX.test(email)) {
			toaster.create({
				title: t("register.validationErrorTitle"),
				description: t("register.enterValidEmail"),
				type: "error",
			});
			return;
		}

		if (email !== repeatEmail) {
			toaster.create({
				title: t("register.validationErrorTitle"),
				description: t("register.emailsDoNotMatch"),
				type: "error",
			});
			return;
		}

		if (password.length < 8) {
			toaster.create({
				title: t("register.validationErrorTitle"),
				description: t("register.passwordMinLength"),
				type: "error",
			});
			return;
		}

		// eslint-disable-next-line security/detect-possible-timing-attacks
		if (password !== repeatPassword) {
			toaster.create({
				title: t("register.validationErrorTitle"),
				description: t("register.passwordsDoNotMatch"),
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
				title: t("register.registrationSuccessTitle"),
				description: t("register.registrationSuccessDesc"),
				type: "success",
			});
			navigate("/login");
		} catch (err: unknown) {
			let errorCode = "UNKNOWN";
			if (isAxiosError(err)) {
				errorCode = err.response?.data?.errorCode ?? "UNKNOWN";
			}
			toaster.create({
				title: t("register.registrationFailedTitle"),
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
			brandSubtitle={t("register.brandSubtitle")}
			actionLabel={t("register.actionLabel")}
			actionTitle={t("register.actionTitle")}
		>
			<Stack gap="4" as="form" onSubmit={handleSubmit}>
				{/* Basic info */}
				<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
					<Field label={t("register.nameLabel")} required>
						<Input
							placeholder="Jane"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isFormDisabled}
						/>
					</Field>
					<Field label={t("register.surnameLabel")} required>
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
					label={t("register.emailLabel")}
					required
					invalid={!isEmailValid}
					errorText={t("register.enterValidEmail")}
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
					label={t("register.repeatEmailLabel")}
					required
					invalid={Boolean(repeatEmail && email !== repeatEmail)}
					errorText={t("register.emailsDoNotMatch")}
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
					label={t("register.passwordLabel")}
					required
					invalid={!isPasswordValid}
					errorText={t("register.passwordMinLength")}
				>
					<PasswordInput
						placeholder={t("register.passwordPlaceholder")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={isFormDisabled}
					/>
				</Field>
				<Field
					label={t("register.repeatPasswordLabel")}
					required
					invalid={Boolean(
						repeatPassword && password !== repeatPassword,
					)}
					errorText={t("register.passwordsDoNotMatch")}
				>
					<PasswordInput
						placeholder={t("register.repeatPasswordPlaceholder")}
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
					{t("register.submitButton")}
				</Button>

				{/* Link to login */}
				<Text fontSize="sm" textAlign="center">
					<Link asChild>
						<RouterLink to="/login">
							{t("register.alreadyHaveAccount")}
						</RouterLink>
					</Link>
				</Text>
			</Stack>
		</AuthContainer>
	);
}

