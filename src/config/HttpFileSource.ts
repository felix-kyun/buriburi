import type { Source, SourceWrapper } from "@/types/Source";

export class HttpFileSource implements SourceWrapper<
	Extract<Source, { type: "http" }>
> {
	readonly id: string;
	readonly uri: string;
	readonly type = "http" as const;

	constructor(source: Extract<Source, { type: "http" }>) {
		this.id = source.id;
		this.uri = source.uri;
	}

	get(): Extract<Source, { type: "http" }> {
		return {
			id: this.id,
			uri: this.uri,
			type: this.type,
		};
	}

	public static async FromURI(uri: string): Promise<HttpFileSource> {
		return new HttpFileSource({
			id: crypto.randomUUID(),
			type: "http",
			uri,
		});
	}
}
