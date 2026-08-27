export class IzumiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "IzumiError";
		Object.setPrototypeOf(this, IzumiError.prototype);
	}
}
