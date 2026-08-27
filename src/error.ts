export class IzumiError extends Error {
	constructor(message: string, cause?: unknown) {
		super(message);
		this.name = "IzumiError";
		this.cause = cause;
		Object.setPrototypeOf(this, IzumiError.prototype);
	}
}
