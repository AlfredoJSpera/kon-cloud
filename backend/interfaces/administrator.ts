import { AdministratorBasicInfo } from "./common";

export interface IAdministratorRegisterInput {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface IAdministratorRegisterOutput {
	administratorId: string;
}

export interface IAdministratorMeOutput extends AdministratorBasicInfo {}
