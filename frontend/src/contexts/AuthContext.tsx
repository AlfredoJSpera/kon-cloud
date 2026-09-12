import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import type { IAdministratorUpdateInput } from "@backend-interfaces/administrator";
import { createContext } from "react";

export interface IAuthContext {
	//TODO: Remove these two when removing AuthTestPage
	token: string | undefined;
	setToken: React.Dispatch<React.SetStateAction<string | undefined>>;

	/** Basic information about the logged-in user. */
	user: AdministratorBasicInfo | undefined;
	/** Indicates whether session restoration is in progress on page load. */
	isSessionRestoring: boolean;

	login: (credentials: IAuthLoginInput) => Promise<void>;
	logout: () => Promise<void>;
	updateProfile: (
		data: IAdministratorUpdateInput,
	) => Promise<AdministratorBasicInfo>;
}

/** Context to access authentication state. Must be used within an `AuthProvider`. */
export const AuthContext = createContext<IAuthContext | null>(null);
