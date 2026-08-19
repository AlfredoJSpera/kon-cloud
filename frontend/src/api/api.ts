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
import type {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";
import type {
	ITenantCreateInput,
	ITenantOutput,
	ITenantUpdateInput,
} from "@backend-interfaces/tenant";
import axios, { type AxiosRequestConfig } from "axios";

declare global {
	interface Window {
		__ENV__?: {
			VITE_BACKEND_URL?: string;
		};
	}
}

const url: string =
	window.__ENV__?.VITE_BACKEND_URL ||
	import.meta.env.VITE_BACKEND_URL ||
	"http://localhost:3000";
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
	condominiums: {
		list: (options?: AxiosRequestConfig) =>
			api.get<ICondominiumOutput[]>("/condominiums", options),
		getById: (id: number, options?: AxiosRequestConfig) =>
			api.get<ICondominiumOutput>(`/condominiums/${id}`, options),
		create: (
			data: ICondominiumCreateInput,
			options?: AxiosRequestConfig,
		) =>
			api.post<ICondominiumOutput>("/condominiums", data, options),
		update: (
			id: number,
			data: ICondominiumUpdateInput,
			options?: AxiosRequestConfig,
		) =>
			api.put<ICondominiumOutput>(`/condominiums/${id}`, data, options),
		delete: (id: number, options?: AxiosRequestConfig) =>
			api.delete<{ message: string }>(`/condominiums/${id}`, options),
	},
	tenants: {
		list: (condominiumId: number, options?: AxiosRequestConfig) =>
			api.get<ITenantOutput[]>(
				`/tenants?condominiumId=${condominiumId}`,
				options,
			),
		getById: (id: number, options?: AxiosRequestConfig) =>
			api.get<ITenantOutput>(`/tenants/${id}`, options),
		create: (data: ITenantCreateInput, options?: AxiosRequestConfig) =>
			api.post<ITenantOutput>("/tenants", data, options),
		update: (
			id: number,
			data: ITenantUpdateInput,
			options?: AxiosRequestConfig,
		) => api.put<ITenantOutput>(`/tenants/${id}`, data, options),
		delete: (id: number, options?: AxiosRequestConfig) =>
			api.delete<{ message: string }>(`/tenants/${id}`, options),
	},
};
