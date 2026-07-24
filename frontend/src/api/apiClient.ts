import type { IAuthRefreshTokenOutput } from "@backend-interfaces/auth";
import axios, { AxiosError } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import Cookies from "js-cookie";

//============================//
// Get backend URL from .env  //
//============================//

const url: string | undefined = import.meta.env.VITE_BACKEND_URL;
if (!url) {
	throw new Error("VITE_BACKEND_URL is not defined in .env");
}
const backendUrl = url.replace(/\/$/, "");

/** A custom axios instance for connecting to the backend API. */
export const api = axios.create({
	baseURL: backendUrl,
	withCredentials: true, // For sending cookies
});

//============================//
// Low-level token management //
//============================//

/** Holds the access token in-memory instead of localStorage to avoid XSS attacks. */
let accessToken: string | undefined = undefined;
/** Updates the in-memory token. */
export const setAccessToken = (token: string | undefined) => {
	accessToken = token;
};
export const getAccessToken = () => accessToken;

//============================//
//   CSRF cookie management   //
//============================//

export function getCsrfToken(): string | undefined {
	return (
		Cookies.get("psifi.x-csrf-token") ||
		Cookies.get("__Host-psifi.x-csrf-token") ||
		Cookies.get("csrfToken") ||
		Cookies.get("x-csrf-token")
	);
}
export function clearCsrfToken(): void {
	Cookies.remove("psifi.x-csrf-token", { path: "/" });
	Cookies.remove("__Host-psifi.x-csrf-token", { path: "/" });
	Cookies.remove("csrfToken", { path: "/" });
	Cookies.remove("x-csrf-token", { path: "/" });
}

//============================//
//  React-to-Axios Callbacks  //
//============================//

type OnTokenRefreshedCallback = (newToken: string) => void;
type OnAuthFailedCallback = () => void;

/** Notifies React that the token has been refreshed. */
let onTokenRefreshed: OnTokenRefreshedCallback | null = null;
/** Notifies React that the token refresh has failed. */
let onTokenRefreshFailed: OnAuthFailedCallback | null = null;

/**
 * Allows setting a callback when React is notified of
 * a successful or failed token refresh.
 *
 * @param onRefreshed A callback to handle the new refreshed token.
 * @param onFailed A callback to handle the auth failing.
 */
export const setAuthCallbacks = (
	onRefreshed: OnTokenRefreshedCallback,
	onFailed: OnAuthFailedCallback,
) => {
	onTokenRefreshed = onRefreshed;
	onTokenRefreshFailed = onFailed;
};

//==========================//
// API Request Interceptor  //
//==========================//

// Automatically appends accessToken and CSRF token (if present)
// to each HTTP request made to the API
api.interceptors.request.use((config) => {
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}
	const csrfToken = getCsrfToken();
	if (csrfToken && !config.headers["x-csrf-token"]) {
		config.headers["x-csrf-token"] = csrfToken;
	}
	return config;
});

//============================//
//  Automatic Silent Refresh  //
//============================//

/**
 * Refresh logic for 401 Unauthorized using `axios-auth-refresh`.
 */
const refreshAuthLogic = async (failedRequest: AxiosError) => {
	const requestUrl = failedRequest?.response?.config?.url || "";

	// Prevent infinite loops by ignoring 401s from these URLs
	if (
		requestUrl.includes("/auth/login") ||
		requestUrl.includes("/auth/refresh-token") ||
		requestUrl.includes("/refresh-token")
	) {
		return Promise.reject(failedRequest);
	}

	try {
		// Try to refresh the auth token
		const csrfToken = getCsrfToken();
		const response = await api.get<IAuthRefreshTokenOutput>(
			"/auth/refresh-token",
			{
				headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
			},
		);
		const newAccessToken = response.data.accessToken;
		setAccessToken(newAccessToken);

		// Set the new authentication token to the original failed request
		if (
			failedRequest.response &&
			failedRequest.response.config &&
			failedRequest.response.config.headers
		) {
			failedRequest.response.config.headers.Authorization = `Bearer ${newAccessToken}`;
		}

		// Notify React of the success
		if (onTokenRefreshed) {
			onTokenRefreshed(newAccessToken);
		}

		// Retry original failed request
		return Promise.resolve();
	} catch (error) {
		// Clear local token and notify React of the failure
		setAccessToken(undefined);
		if (onTokenRefreshFailed) {
			onTokenRefreshFailed();
		}
		return Promise.reject(error);
	}
};

// Instantiate automatic auth refresh interceptor on a 401
createAuthRefreshInterceptor(api, refreshAuthLogic, {
	statusCodes: [401],
});
