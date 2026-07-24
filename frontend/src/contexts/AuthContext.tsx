import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import { createContext } from "react";

export interface IAuthContext {
	/** Basic information about the logged-in user. */
	profile: AdministratorBasicInfo | undefined;
	/** Helper flag for route guards and conditional rendering. */
	isAuthenticated: boolean;
	/** Indicates whether session restoration is in progress on page load. */
	isSessionRestoring: boolean;

	login: (credentials: IAuthLoginInput) => Promise<void>;
	logout: () => Promise<void>;
}

/** Context to access authentication state. Must be used within an `AuthProvider`. */
export const AuthContext = createContext<IAuthContext | null>(null);
