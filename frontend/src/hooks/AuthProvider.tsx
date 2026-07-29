import { useEffect, useState, useRef, type ReactNode } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { toaster } from "@/components/chakraui/toaster";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import getApiErrorMessage from "@/api/apiErrorMessages";
import { AxiosError, isAxiosError } from "axios";
import { api, makeApiRequest } from "@/api/api";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import {
	clearCsrfTokenCookie,
	clearRefreshTokenCookie,
	getCsrfTokenCookie,
} from "@/api/cookieManagement";

export default function AuthProvider(props: { children: ReactNode }) {
	const [token, setToken] = useState<string>();
	const [user, setUser] = useState<AdministratorBasicInfo>();
	const [isSessionRestoring, setIsSessionRestoring] = useState<boolean>(true);

	/** Synchronous ref to bypass React state re-render timing delays */
	const tokenRef = useRef<string | undefined>(token);
	const initPromiseRef = useRef<Promise<{
		token: string;
		profile: AdministratorBasicInfo;
	} | null> | null>(null);

	useEffect(() => {
		tokenRef.current = token;
	}, [token]);

	//======================//
	//  API requests setup  //
	//======================//

	// Attach access token and CSRF token to outgoing requests
	useEffect(() => {
		const interceptorId = api.interceptors.request.use((config) => {
			const currentToken = tokenRef.current;

			// Only attach Bearer token if NOT already explicitly provided on config
			if (currentToken && !config.headers.Authorization) {
				config.headers.Authorization = `Bearer ${currentToken}`;
			}

			const csrfToken = getCsrfTokenCookie();
			if (csrfToken && !config.headers["x-csrf-token"]) {
				config.headers["x-csrf-token"] = csrfToken;
			}

			return config;
		});

		return () => {
			api.interceptors.request.eject(interceptorId);
		};
	}, []);

	// Automatic auth refresh interceptor
	useEffect(() => {
		const interceptorId = createAuthRefreshInterceptor(
			api,
			async (failedRequest: AxiosError) => {
				const requestUrl = failedRequest?.response?.config?.url || "";

				if (
					requestUrl.includes("/auth/login") ||
					requestUrl.includes("/auth/refresh-token") ||
					requestUrl.includes("/refresh-token")
				) {
					return Promise.reject(failedRequest);
				}

				try {
					const response = await makeApiRequest.auth.refreshToken();
					const newAccessToken = response.data.accessToken;

					// Update both synchronously in ref and scheduled state
					tokenRef.current = newAccessToken;
					setToken(newAccessToken);

					// Set header on failedRequest.config for the retried attempt
					if (failedRequest.config?.headers) {
						if (
							typeof failedRequest.config.headers.set ===
							"function"
						) {
							failedRequest.config.headers.set(
								"Authorization",
								`Bearer ${newAccessToken}`,
							);
						} else {
							failedRequest.config.headers["Authorization"] =
								`Bearer ${newAccessToken}`;
						}
					}

					return Promise.resolve();
				} catch (error) {
					tokenRef.current = undefined;
					setToken(undefined);
					setUser(undefined);
					toaster.create({
						description: "Session expired. Please log back in.",
						type: "error",
					});
					return Promise.reject(error);
				}
			},
			{ statusCodes: [401] },
		);

		return () => {
			api.interceptors.response.eject(interceptorId);
		};
	}, []);

	// Initial session restoration on app load
	useEffect(() => {
		let isCancelled = false;

		if (!initPromiseRef.current) {
			initPromiseRef.current = (async () => {
				try {
					const res = await makeApiRequest.auth.refreshToken();
					const newToken = res.data.accessToken;
					tokenRef.current = newToken;

					const profileRes = await makeApiRequest.administrators.me({
						headers: { Authorization: `Bearer ${newToken}` },
					});

					return {
						token: newToken,
						profile: profileRes.data,
					};
				} catch {
					return null;
				}
			})();
		}

		initPromiseRef.current.then((result) => {
			if (!isCancelled) {
				if (result) {
					tokenRef.current = result.token;
					setToken(result.token);
					setUser(result.profile);
				} else {
					tokenRef.current = undefined;
					setToken(undefined);
					setUser(undefined);
				}
				setIsSessionRestoring(false);
			}
		});

		return () => {
			isCancelled = true;
		};
	}, []);

	//===========================//
	//  Standard Auth Workflows  //
	//===========================//

	const login = async (credentials: IAuthLoginInput) => {
		try {
			const res = await makeApiRequest.auth.login(credentials);
			tokenRef.current = res.data.accessToken;
			setToken(res.data.accessToken);
			setUser(res.data.profile);
		} catch (err: unknown) {
			let errorCode = "UNKNOWN";
			if (isAxiosError(err)) {
				errorCode = err.response?.data.errorCode || err.code || "";
			}
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
			clearCsrfTokenCookie();
			clearRefreshTokenCookie();
			tokenRef.current = undefined;
			initPromiseRef.current = null;
			setToken(undefined);
			setUser(undefined);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				token,
				setToken: (newToken) => {
					tokenRef.current =
						typeof newToken === "function"
							? newToken(tokenRef.current)
							: newToken;
					setToken(newToken);
				},
				user,
				isSessionRestoring,
				login,
				logout,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}
