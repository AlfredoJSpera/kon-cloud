import { AdministratorBasicInfo } from "./common";

export interface IAuthLoginInput {
	email: string;
	password: string;
}

export interface IAuthLoginOutput {
	accessToken: string;
	refreshToken: string;
	profile: AdministratorBasicInfo;
}

export interface IAuthRefreshTokenInput {
	refreshToken: string;
}

export interface IAuthRefreshTokenOutput {
	accessToken: string;
}
