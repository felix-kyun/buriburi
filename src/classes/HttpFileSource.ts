import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ManifestWrapper } from "@class/ManifestWrapper";
import type { Source, SourceType, SourceWrapper } from "@type/Source";
import { IzumiError } from "@/error";

export class HttpFileSource implements SourceWrapper<SourceType<"http">> {
	readonly id: string;
	readonly uri: string;
	readonly type = "http" as const;
	readonly manifest: ManifestWrapper;

	private constructor(
		source: Extract<Source, { type: "http" }>,
		manifest: ManifestWrapper,
	) {
		this.id = source.id;
		this.uri = source.uri;
		this.manifest = manifest;
	}

	get(): Extract<Source, { type: "http" }> {
		return {
			id: this.id,
			uri: this.uri,
			type: this.type,
		};
	}

	public async init() {}

	public async update() {}

	public async remove() {}

	public static async FromURI(uri: string): Promise<HttpFileSource> {
		let rawManifest: Response;
		try {
			rawManifest = await fetch(uri);
		} catch (e) {
			throw new IzumiError("Failed to fetch manifest", e);
		}

		if (!rawManifest.ok) {
			throw new IzumiError(
				"Failed to fetch manifest",
				new Error(rawManifest.statusText),
			);
		}

		let manifest: ManifestWrapper;
		try {
			manifest = ManifestWrapper.fromJson(await rawManifest.json());
		} catch (e) {
			throw new IzumiError("Failed to parse manifest", e);
		}

		return new HttpFileSource(
			{
				id: manifest.get().id,
				type: "http",
				uri,
			},
			manifest,
		);
	}

	public static FromSource(
		sourceDirectory: string,
		source: SourceType<"http">,
	) {
		const path = join(sourceDirectory, "manifest.json");

		const raw = readFileSync(path, "utf-8");
		const manifest = ManifestWrapper.fromJson(JSON.parse(raw));

		return new this(source, manifest);
	}
}
