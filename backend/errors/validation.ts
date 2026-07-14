import KonBaseError from "./base";

export class KonMissingRequiredFieldsError extends KonBaseError {
	constructor(message: string = "Missing required field.") {
		super(message, 400);
	}
}

export class KonIncorrectFieldTypeError extends KonBaseError {
	constructor(message: string = "Incorrect field type.") {
		super(message, 400);
	}
}

export class KonNotFoundError extends KonBaseError {
	constructor(message: string = "Resource not found.") {
		super(message, 404);
	}
}

export class KonEmailAlreadyExistsError extends KonBaseError {
	constructor(message: string = "This email is already registered.") {
		super(message, 409);
	}
}
