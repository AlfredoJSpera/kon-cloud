import KonBaseError from "./base";

export class KonInvalidCredentialsError extends KonBaseError {
	constructor(message: string = "Invalid credentials.") {
		super(message, 401, "INVALID_CREDENTIALS");
	}
}

export class KonMissingRefreshTokenError extends KonBaseError {
	constructor(message: string = "Missing refresh token.") {
		super(message, 400, "MISSING_REFRESH_TOKEN");
	}
}

export class KonInvalidRefreshTokenError extends KonBaseError {
	constructor(message: string = "Invalid refresh token.") {
		super(message, 401, "INVALID_REFRESH_TOKEN");
	}
}

export class KonMissingAuthenticationTokenError extends KonBaseError {
	constructor(message: string = "Missing authentication token.") {
		super(message, 400, "MISSING_AUTHENTICATION_TOKEN");
	}
}

export class KonInvalidAuthenticationTokenError extends KonBaseError {
	constructor(message: string = "Invalid authentication token.") {
		super(message, 401, "INVALID_AUTHENTICATION_TOKEN");
	}
}

export class KonExpiredAuthenticationTokenError extends KonBaseError {
	constructor(message: string = "Expired authentication token.") {
		super(message, 401, "EXPIRED_AUTHENTICATION_TOKEN");
	}
}
