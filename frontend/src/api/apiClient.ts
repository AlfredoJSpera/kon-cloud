import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import Cookies from "js-cookie";

const url: string | undefined = import.meta.env.VITE_BACKEND_URL;
if (!url) {
	throw new Error("VITE_BACKEND_URL is not defined in .env");
}
const backendUrl = url.replace(/\/$/, "");

// Create custom Axios instance
export const api = axios.create({
	baseURL: backendUrl,
	withCredentials: true,
});

let accessToken: string | undefined = undefined;

export const setAccessToken = (token: string | undefined) => {
	accessToken = token;
};

export const getAccessToken = () => accessToken;

export function getCsrfToken(): string | undefined {
	return (
		Cookies.get("psifi.x-csrf-token") ||
		Cookies.get("__Host-psifi.x-csrf-token") ||
		Cookies.get("csrfToken") ||
		Cookies.get("x-csrf-token")
	);
}

type OnTokenRefreshedCallback = (newToken: string) => void;
type OnAuthFailedCallback = () => void;

let onTokenRefreshed: OnTokenRefreshedCallback | null = null;
let onAuthFailed: OnAuthFailedCallback | null = null;

export const setAuthCallbacks = (
	onRefreshed: OnTokenRefreshedCallback,
	onFailed: OnAuthFailedCallback,
) => {
	onTokenRefreshed = onRefreshed;
	onAuthFailed = onFailed;
};

// Request interceptor: automatically append accessToken and CSRF token
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

// Refresh logic for 401 Unauthorized using axios-auth-refresh
const refreshAuthLogic = async (failedRequest: any) => {
	const requestUrl = failedRequest?.response?.config?.url || "";
	if (
		requestUrl.includes("/auth/login") ||
		requestUrl.includes("/auth/refresh-token") ||
		requestUrl.includes("/refresh-token")
	) {
		return Promise.reject(failedRequest);
	}

	try {
		const csrfToken = getCsrfToken();
		const response = await api.get<{ accessToken: string }>(
			"/auth/refresh-token",
			{
				headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
			},
		);

		const newAccessToken = response.data.accessToken;
		setAccessToken(newAccessToken);
		failedRequest.response.config.headers.Authorization = `Bearer ${newAccessToken}`;

		if (onTokenRefreshed) {
			onTokenRefreshed(newAccessToken);
		}
		return Promise.resolve();
	} catch (error) {
		setAccessToken(undefined);
		if (onAuthFailed) {
			onAuthFailed();
		}
		return Promise.reject(error);
	}
};

// Instantiate automatic auth refresh interceptor
createAuthRefreshInterceptor(api, refreshAuthLogic, {
	statusCodes: [401],
});


