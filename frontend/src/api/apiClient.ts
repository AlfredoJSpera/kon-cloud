import axios from "axios";

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
	if (typeof document === "undefined") return undefined;
	const matches = document.cookie.match(
		/(?:^|; )(?:psifi\.x-csrf-token|__Host-psifi\.x-csrf-token|csrfToken|x-csrf-token)=([^;]*)/,
	);
	return matches ? decodeURIComponent(matches[1]) : undefined;
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

// Response interceptor: automatically handle 401 and token refresh
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else if (token) {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (
			error.response?.status === 401 &&
			originalRequest &&
			!originalRequest._retry
		) {
			const requestUrl = originalRequest.url || "";
			if (
				requestUrl.includes("/auth/login") ||
				requestUrl.includes("/auth/refresh-token") ||
				requestUrl.includes("/refresh-token")
			) {
				return Promise.reject(error);
			}

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({
						resolve: (token: string) => {
							originalRequest.headers.Authorization = `Bearer ${token}`;
							resolve(api(originalRequest));
						},
						reject: (err: any) => {
							reject(err);
						},
					});
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const csrfToken = getCsrfToken();
				const response = await api.get<{ accessToken: string }>(
					"/auth/refresh-token",
					{
						headers: csrfToken
							? { "x-csrf-token": csrfToken }
							: undefined,
					},
				);

				const newAccessToken = response.data.accessToken;
				setAccessToken(newAccessToken);
				if (onTokenRefreshed) {
					onTokenRefreshed(newAccessToken);
				}

				processQueue(null, newAccessToken);
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				setAccessToken(undefined);
				if (onAuthFailed) {
					onAuthFailed();
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	},
);

