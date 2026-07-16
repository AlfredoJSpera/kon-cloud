import { AdministratorBasicInfo } from "./common";

export interface IAuthLoginInput {
	email: string;
	password: string;
}

export interface IAuthLoginOutput {
	accessToken: string;
	profile: AdministratorBasicInfo;
	// refreshToken passed via httpOnly cookie
}

export interface IAuthRefreshTokenInput {
	// refreshToken passed via httpOnly cookie
}

export interface IAuthRefreshTokenOutput {
	accessToken: string;
	// refreshToken passed via httpOnly cookie
}
