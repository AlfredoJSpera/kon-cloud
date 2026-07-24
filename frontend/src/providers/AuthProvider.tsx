import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import {
	api,
	clearCsrfToken,
	setAccessToken,
	setAuthCallbacks,
} from "@/api/apiClient";
import { toaster } from "@/components/chakraui/toaster";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type {
	IAuthLoginInput,
	IAuthLoginOutput,
} from "@backend-interfaces/auth";
import getApiErrorMessage from "@/api/apiErrorMessages";

export default function AuthProvider(props: { children: ReactNode }) {
	const [token, setTokenState] = useState<string | undefined>();
	const [profile, setProfile] = useState<
		AdministratorBasicInfo | undefined
	>();
	const [isSessionRestoring, setIsSessionRestoring] = useState<boolean>(true);

	/**
	 * Custom wrapper around React's `useState` setter that keeps
	 * React state and Axios in-memory state (`setAccessToken`) synchronized.
	 */
	const setToken: React.Dispatch<React.SetStateAction<string | undefined>> =
		useCallback((value) => {
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

	//=======================================//
	//  Register callbacks for Axios events  //
	//=======================================//

	useEffect(() => {
		setAuthCallbacks(
			(newToken) => {
				// Update profile and token states
				setTokenState(newToken);
				setAccessToken(newToken);
				fetchProfile();
			},
			() => {
				// Clear profile and token states
				setTokenState(undefined);
				setAccessToken(undefined);
				setProfile(undefined);
			},
		);
	}, [fetchProfile]);

	//============================================//
	//  Initial authentication check on app load  //
	//============================================//

	useEffect(() => {
		/** Cleanup flag to avoid memory leaks or React state updates on unmounted components. */
		let isMounted = true;

		/** Attempt token refresh via httpOnly refreshToken cookie and csrfToken. */
		const initAuth = async () => {
			try {
				const refreshRes = await api.get<{ accessToken: string }>(
					"/auth/refresh-token",
				);

				// User had valid auth cookies
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
				// User did not have valid auth cookies
				if (isMounted) {
					setTokenState(undefined);
					setAccessToken(undefined);
					setProfile(undefined);
				}
			} finally {
				if (isMounted) {
					setIsSessionRestoring(false);
				}
			}
		};

		initAuth();

		return () => {
			isMounted = false;
		};
	}, []);

	//===========================//
	//  Standard Auth Workflows  //
	//===========================//

	const login = async (credentials: IAuthLoginInput) => {
		try {
			const res = await api.post<IAuthLoginOutput>(
				"/auth/login",
				credentials,
			);
			setToken(res.data.accessToken);
			setProfile(res.data.profile);
		} catch (err: unknown) {
			const error = err as { response?: { data?: { errorCode?: string } }; code?: string };
			const errorCode =
				error.response?.data?.errorCode || error.code || "ERR_NETWORK";
			const message = getApiErrorMessage(errorCode);
			toaster.create({
				title: "Login failed",
				description: message,
				type: "error",
			});
			throw err;
		}
	};

	const logout = async () => {
		try {
			await api.post("/auth/logout");
		} catch {
			// Ignore network/server errors during logout
		} finally {
			clearCsrfToken();
			setToken(undefined);
			setProfile(undefined);
		}
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
				isSessionRestoring,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}
