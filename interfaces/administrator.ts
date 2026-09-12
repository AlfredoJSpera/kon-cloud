import { type AdministratorBasicInfo } from "./common";

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

export interface IAdministratorUpdateInput {
	firstName?: string;
	lastName?: string;
	email?: string;
	currentPassword?: string;
	newPassword?: string;
}

export interface IAdministratorUpdateOutput extends AdministratorBasicInfo {}

