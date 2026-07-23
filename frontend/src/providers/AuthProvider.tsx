import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { api, setAccessToken, setAuthCallbacks } from "@/api/apiClient";
import getApiErrorMessage from "@/api/apiErrorMessages";
import { toaster } from "@/components/chakraui/toaster";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type {
	IAuthLoginInput,
	IAuthLoginOutput,
} from "@backend-interfaces/auth";

export default function AuthProvider(props: { children: ReactNode }) {
	const [token, setTokenState] = useState<string | undefined>();
	const [profile, setProfile] = useState<AdministratorBasicInfo | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const setToken: React.Dispatch<
		React.SetStateAction<string | undefined>
	> = useCallback((value) => {
		setTokenState((prev) => {
			const next = typeof value === "function" ? value(prev) : value;
			setAccessToken(next);
			return next;
		});
	}, []);

	const fetchProfile = useCallback(async () => {
		try {
			const res =
				await api.get<AdministratorBasicInfo>("/administrators/me");
			setProfile(res.data);
		} catch {
			setProfile(undefined);
		}
	}, []);

	// Synchronize auth callbacks from apiClient
	useEffect(() => {
		setAuthCallbacks(
			(newToken) => {
				setTokenState(newToken);
				setAccessToken(newToken);
				fetchProfile();
			},
			() => {
				setTokenState(undefined);
				setAccessToken(undefined);
				setProfile(undefined);
			},
		);
	}, [fetchProfile]);

	// Initial authentication check on app load
	useEffect(() => {
		let isMounted = true;

		const initAuth = async () => {
			try {
				// Attempt token refresh via httpOnly refreshToken cookie & csrfToken
				const refreshRes = await api.get<{ accessToken: string }>(
					"/auth/refresh-token",
				);
				const newToken = refreshRes.data.accessToken;

				if (isMounted) {
					setTokenState(newToken);
					setAccessToken(newToken);
					// Fetch administrator profile with the new access token
					const profileRes =
						await api.get<AdministratorBasicInfo>(
							"/administrators/me",
						);
					if (isMounted) {
						setProfile(profileRes.data);
					}
				}
			} catch {
				if (isMounted) {
					setTokenState(undefined);
					setAccessToken(undefined);
					setProfile(undefined);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		initAuth();

		return () => {
			isMounted = false;
		};
	}, []);

	const login = async (credentials: IAuthLoginInput) => {
		try {
			const res = await api.post<IAuthLoginOutput>(
				"/auth/login",
				credentials,
			);
			setToken(res.data.accessToken);
			setProfile(res.data.profile);
		} catch (err: any) {
			const errorCode =
				err.response?.data?.errorCode || err.code || "ERR_NETWORK";
			const message = getApiErrorMessage(errorCode);
			toaster.create({
				title: "Login failed",
				description: message,
				type: "error",
			});
			throw err;
		}
	};

	const logout = () => {
		setToken(undefined);
		setProfile(undefined);
	};

	return (
		<AuthContext.Provider
			value={{
				token,
				setToken,
				profile,
				setProfile,
				login,
				logout,
				isLoading,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}

