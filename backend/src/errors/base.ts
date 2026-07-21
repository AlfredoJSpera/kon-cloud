class KonBaseError extends Error {
	statusCode: number;
	errorCode: string;

	constructor(message: string, statusCode = 500, errorCode: string) {
		super(message);
		this.name = new.target.name;
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default KonBaseError;
