import type { IAuthLoginInput } from "@backend-interfaces/auth";
import type { AdministratorBasicInfo } from "@backend-interfaces/common";
import { createContext } from "react";

interface IAuthContext {
	accessToken: string | undefined;
	setAccessToken: React.Dispatch<React.SetStateAction<string | undefined>>;
	csrfToken: string | undefined;
	setCsrfToken: React.Dispatch<React.SetStateAction<string | undefined>>;
	profile: AdministratorBasicInfo | undefined;
	setProfile: React.Dispatch<
		React.SetStateAction<AdministratorBasicInfo | undefined>
	>;
	login: (credentials: IAuthLoginInput) => Promise<void>;
}

export const AuthContext = createContext<IAuthContext | null>(null);
