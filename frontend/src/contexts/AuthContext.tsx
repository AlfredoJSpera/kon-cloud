import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import type { IAuthLoginInput } from "@backend-interfaces/auth";
import { createContext } from "react";

export interface IAuthContext {
	token: string | undefined;
	setToken: React.Dispatch<React.SetStateAction<string | undefined>>;
	profile: AdministratorBasicInfo | undefined;
	setProfile: React.Dispatch<
		React.SetStateAction<AdministratorBasicInfo | undefined>
	>;
	login: (credentials: IAuthLoginInput) => Promise<void>;
	logout: () => void;
	isLoading: boolean;
}

export const AuthContext = createContext<IAuthContext | null>(null);

