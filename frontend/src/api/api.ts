import type {
	IAuthLoginInput,
	IAuthLoginOutput,
	IAuthRefreshTokenOutput,
} from "@backend-interfaces/auth";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type {
	IAdministratorRegisterInput,
	IAdministratorRegisterOutput,
} from "@backend-interfaces/administrator";
import axios, { type AxiosRequestConfig } from "axios";

//============================//
// Get backend URL from .env  //
//============================//

const url: string | undefined = import.meta.env.VITE_BACKEND_URL;
if (!url) {
	throw new Error("VITE_BACKEND_URL is not defined in .env");
}
const backendUrl = url.replace(/\/$/, ""); // Remove trailing "/"

//====================//
// API Axios instance //
//====================//

/** A custom axios instance for connecting to the backend API. */
export const api = axios.create({
	baseURL: backendUrl,
	withCredentials: true, // For sending cookies
});

/**
 * A collection of typed API request helpers grouped by domain.
 */
export const makeApiRequest = {
	administrators: {
		me: (options?: AxiosRequestConfig) =>
			api.get<AdministratorBasicInfo>("/administrators/me", options),
		register: (
			credentials: IAdministratorRegisterInput,
			options?: AxiosRequestConfig,
		) =>
			api.post<IAdministratorRegisterOutput>(
				"/administrators/register",
				credentials,
				options,
			),
	},
	auth: {
		login: (credentials: IAuthLoginInput, options?: AxiosRequestConfig) =>
			api.post<IAuthLoginOutput>("/auth/login", credentials, options),
		logout: (options?: AxiosRequestConfig) =>
			api.post("/auth/logout", options),
		refreshToken: (options?: AxiosRequestConfig) =>
			api.get<IAuthRefreshTokenOutput>("/auth/refresh-token", options),
	},
};
