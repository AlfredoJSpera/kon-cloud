import KonBaseError from "./base";

export class KonInvalidCredentialsError extends KonBaseError {
	constructor(message: string = "Invalid credentials.") {
		super(message, 401);
	}
}

export class KonMissingTokenError extends KonBaseError {
	constructor(message: string = "Missing token.") {
		super(message, 401);
	}
}

export class KonInvalidTokenError extends KonBaseError {
	constructor(message: string = "Invalid or expired token.") {
		super(message, 401);
	}
}

export class KonExpiredTokenError extends KonBaseError {
	constructor(message: string = "Expired token.") {
		super(message, 401);
	}
}
