const ErrorMessages: Record<string, string> = {
	// Validation
	MISSING_REQUIRED_FIELDS: "You missed some required information.",
	INCORRECT_FIELD_TYPE: "Please check the format of your input.",
	NOT_FOUND: "The requested information could not be found.",
	EMAIL_ALREADY_EXISTS: "That email is already in use. Try another.",
	// Authentication
	INVALID_CREDENTIALS: "The email or password you entered are incorrect.",
	MISSING_REFRESH_TOKEN: "Your session has ended. Please log in again.",
	INVALID_REFRESH_TOKEN: "Session invalid. Please log in again.",
	MISSING_AUTHENTICATION_TOKEN: "You must be logged in to access this page.",
	INVALID_AUTHENTICATION_TOKEN: "Authentication failed. Please log in again.",
	EXPIRED_AUTHENTICATION_TOKEN:
		"Your session has expired. Please log in again.",
	// Axios errors
	ERR_NETWORK: "Server not reachable. Try again later.",
};

export default function handleApiError(errorCode: string) {
	return ErrorMessages[errorCode] || "Something went wrong.";
}
