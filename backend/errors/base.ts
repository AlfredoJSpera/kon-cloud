class KonBaseError extends Error {
	constructor() {
		super();
		this.name = new.target.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default KonBaseError;
