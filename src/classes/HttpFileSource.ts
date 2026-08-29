import { readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ManifestWrapper } from "@class/ManifestWrapper";
import type { Nullable } from "@type/Nullable";
import type { SourceType, SourceWrapper } from "@type/Source";
import { StatusCodes } from "http-status-codes";
import { config } from "@/config";
import { IzumiError } from "@/error";
import { logger } from "@/logger";

export class HttpFileSource implements SourceWrapper<SourceType<"http">> {
	readonly id: string;
	readonly type = "http" as const;
	readonly uri: string;
	etag: Nullable<string>;
	readonly manifest: ManifestWrapper;
	static readonly log = logger.withTag("HttpFileSource");

	private constructor(source: SourceType<"http">, manifest: ManifestWrapper) {
		this.id = source.id;
		this.uri = source.uri;
		this.etag = source.etag;
		this.manifest = manifest;
	}

	get(): SourceType<"http"> {
		return {
			id: this.id,
			uri: this.uri,
			type: this.type,
			etag: this.etag,
		};
	}

	public async init() {
		HttpFileSource.log.debug(`Initializing source ${this.id}`);
		const dir = join(config.sourceManager.getSourceStore(), this.id);
		await mkdir(dir, {
			recursive: true,
		});

		await writeFile(
			join(dir, "manifest.json"),
			JSON.stringify(this.manifest.get()),
		);
	}

	public async update() {
		HttpFileSource.log.debug(`Updating source ${this.id}`);
		let response: Response;
		const headers: Record<string, string> = {};

		if (this.etag) {
			headers["If-None-Match"] = this.etag;
		}

		try {
			response = await fetch(this.uri, {
				headers,
			});

			if (response.status === StatusCodes.NOT_MODIFIED) {
				HttpFileSource.log.debug("Upstream not modified (304)");
				return;
			}

			if (!response.ok) {
				throw new Error(response.statusText);
			}
		} catch (e) {
			throw new IzumiError("Failed to fetch manifest", e);
		}

		let manifest: ManifestWrapper;
		try {
			manifest = ManifestWrapper.fromJson(await response.json());
		} catch (e) {
			throw new IzumiError("Failed to parse manifest", e);
		}

		this.etag = response.headers.get("etag");

		const dir = join(config.sourceManager.getSourceStore(), this.id);
		await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest.get()));
	}

	public async remove() {
		HttpFileSource.log.debug(`Removing source ${this.id}`);
		const dir = join(config.sourceManager.getSourceStore(), this.id);
		await rm(dir, { recursive: true, force: true });
	}

	public static async FromURI(uri: string): Promise<HttpFileSource> {
		HttpFileSource.log.debug(`Creating new HttpFileSource from ${uri}`);
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
				etag: rawManifest.headers.get("etag"),
			},
			manifest,
		);
	}

	public static FromSource(
		sourceDirectory: string,
		source: SourceType<"http">,
	) {
		HttpFileSource.log.debug(`Loading source ${source.id}`);
		const path = join(sourceDirectory, "manifest.json");

		const raw = readFileSync(path, "utf-8");
		const manifest = ManifestWrapper.fromJson(JSON.parse(raw));

		return new this(source, manifest);
	}
}
