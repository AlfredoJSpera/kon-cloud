import KonBaseError from "./base";

export class KonMissingRequiredFieldsError extends KonBaseError {
	constructor(message: string = "Missing required fields.") {
		super(message, 400, "MISSING_REQUIRED_FIELDS");
	}
}

export class KonIncorrectFieldTypeError extends KonBaseError {
	constructor(message: string = "Incorrect field type.") {
		super(message, 400, "INCORRECT_FIELD_TYPE");
	}
}

export class KonNotFoundError extends KonBaseError {
	constructor(message: string = "Resource not found.") {
		super(message, 404, "NOT_FOUND");
	}
}

export class KonEmailAlreadyExistsError extends KonBaseError {
	constructor(message: string = "This email is already registered.") {
		super(message, 409, "EMAIL_ALREADY_EXISTS");
	}
}
