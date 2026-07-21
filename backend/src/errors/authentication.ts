import KonBaseError from "./base";

export class KonInvalidCredentialsError extends KonBaseError {
	constructor(message: string = "Invalid credentials.") {
		super(message, 401, "INVALID_CREDENTIALS");
	}
}

export class KonMissingTokenError extends KonBaseError {
	constructor(message: string = "Missing token.") {
		super(message, 400, "MISSING_TOKEN");
	}
}

export class KonInvalidTokenError extends KonBaseError {
	constructor(message: string = "Invalid token.") {
		super(message, 401, "INVALID_TOKEN");
	}
}

export class KonExpiredTokenError extends KonBaseError {
	constructor(message: string = "Expired token.") {
		super(message, 401, "EXPIRED_TOKEN");
	}
}
