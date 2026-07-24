import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import {
	clearCsrfToken,
	makeApiRequest,
	setAccessToken,
	setOnAuthFailure,
} from "@/api/apiClient";
import { toaster } from "@/components/chakraui/toaster";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import getApiErrorMessage from "@/api/apiErrorMessages";

export default function AuthProvider(props: { children: ReactNode }) {
	const [profile, setProfile] = useState<
		AdministratorBasicInfo | undefined
	>();
	const [isSessionRestoring, setIsSessionRestoring] = useState<boolean>(true);

	// Reset profile if background refresh fails
	useEffect(() => {
		setOnAuthFailure(() => setProfile(undefined));
	}, []);

	//============================================//
	//  Initial authentication check on app load  //
	//============================================//

	useEffect(() => {
		/** Cleanup flag to avoid memory leaks or React state updates on unmounted components. */
		let isMounted = true;

		/** Attempt token refresh via httpOnly refreshToken cookie and csrfToken. */
		const initAuth = async () => {
			try {
				// Refresh token via auth cookies
				const res = await makeApiRequest.auth.refreshToken();
				if (!isMounted) return;

				// User had valid auth cookies
				setAccessToken(res.data.accessToken);

				// Fetch administrator profile with the new access token
				const profileRes = await makeApiRequest.administrators.me();
				if (isMounted) {
					setProfile(profileRes.data);
				}
			} catch {
				// User did not have valid auth cookies
				if (isMounted) {
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
			const res = await makeApiRequest.auth.login(credentials);
			setAccessToken(res.data.accessToken);
			setProfile(res.data.profile);
		} catch (err: unknown) {
			const error = err as {
				response?: { data?: { errorCode?: string } };
				code?: string;
			};
			const errorCode =
				error.response?.data?.errorCode || error.code || "ERR_NETWORK";
			toaster.create({
				title: "Login failed",
				description: getApiErrorMessage(errorCode),
				type: "error",
			});
			throw err;
		}
	};

	const logout = async () => {
		try {
			await makeApiRequest.auth.logout();
		} catch {
			// Ignore network/server errors during logout
		} finally {
			clearCsrfToken();
			setAccessToken(undefined);
			setProfile(undefined);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				profile,
				isAuthenticated: Boolean(profile),
				isSessionRestoring,
				login,
				logout,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}
