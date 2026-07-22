import { useState, type ReactNode } from "react";
import axios from "axios";
import { AuthContext } from "@/contexts/AuthContext";
import { loginUrl } from "@/api/apiUrls";
import getApiErrorMessage from "@/api/apiErrorMessages";
import { toaster } from "@/components/chakraui/toaster";
import type {
	AdministratorBasicInfo,
	IErrorResponse,
} from "@backend-interfaces/common";
import type {
	IAuthLoginInput,
	IAuthLoginOutput,
} from "@backend-interfaces/auth";

export default function AuthProvider(props: { children: ReactNode }) {
	const [accessToken, setAccessToken] = useState<string>();
	const [csrfToken, setCsrfToken] = useState<string>();
	const [profile, setProfile] = useState<AdministratorBasicInfo>();

	const login = async (credentials: IAuthLoginInput) => {
		try {
			const { data: responseData } = await axios.post<IAuthLoginOutput>(
				loginUrl,
				credentials,
			);

			setAccessToken(responseData.accessToken);
			setCsrfToken(responseData.csrfToken);
			setProfile(responseData.profile);

			toaster.create({
				title: "You are now logged in.",
				type: "success",
			});
		} catch (err: unknown) {
			console.error("Login error:", err);

			let errorCode = "UNKNOWN_ERROR";
			if (axios.isAxiosError<IErrorResponse>(err)) {
				errorCode =
					err.response?.data?.errorCode ?? err.code ?? err.message;
			} else if (err instanceof Error) {
				errorCode = err.message;
			}

			const errorMessage = getApiErrorMessage(errorCode);

			toaster.create({
				title: errorMessage,
				type: "error",
			});

			// Re-throw so the calling component knows the login failed
			throw err;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				accessToken,
				setAccessToken,
				csrfToken,
				setCsrfToken,
				profile,
				setProfile,
				login,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}
