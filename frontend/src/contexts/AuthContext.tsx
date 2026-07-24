import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import { createContext } from "react";

export interface IAuthContext {
	/** The current JWT access token, or `undefined` if logged out. */
	token: string | undefined;
	setToken: React.Dispatch<React.SetStateAction<string | undefined>>;

	/** Holds basic information about the logged-in user. */
	profile: AdministratorBasicInfo | undefined;
	setProfile: React.Dispatch<
		React.SetStateAction<AdministratorBasicInfo | undefined>
	>;

	login: (credentials: IAuthLoginInput) => Promise<void>;
	logout: () => Promise<void>;

	/**
	 * Indicates whether the initial session restoration check is still in progress,
	 * preventing flickering or unauthenticated redirects during page load.
	 */
	isSessionRestoring: boolean;
}

/** Context to access authentication state. Must be used within an `AuthProvider`. */
export const AuthContext = createContext<IAuthContext | null>(null);
