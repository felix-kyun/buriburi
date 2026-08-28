import { type Manifest, manifestSchema } from "@/types/Manifest";

export class ManifestWrapper {
	constructor(private readonly manifest: Manifest) {}

	get() {
		return this.manifest;
	}

	public static fromJson(json: Record<string, unknown>) {
		const manifest = manifestSchema.parse(json);

		return new this(manifest);
	}
}
