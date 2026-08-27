import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GithubRepositorySource } from "@/config/GithubRepositorySource";
import { HttpFileSource } from "@/config/HttpFileSource";
import { logger } from "@/logger";
import type { Source, SourceFactory } from "@/types/Source";

// TODO: add lazy loading
// TODO: add runtime schema validation

export class SourceManager {
	private sources: Record<string, Source>;
	private path: string;
	private static validTypes: Record<Source["type"], SourceFactory> = {
		github: GithubRepositorySource,
		http: HttpFileSource,
	};

	constructor(configDirectory: string) {
		this.path = join(configDirectory, "sources.json");
		this.sources = {};

		if (existsSync(this.path)) {
			this.load();
		} else {
			this.init();
		}
	}

	private init() {
		this.sources = {};
		writeFileSync(this.path, JSON.stringify(this.sources));
	}

	private save() {
		writeFileSync(this.path, JSON.stringify(this.sources));
	}

	private load() {
		const raw = readFileSync(this.path, "utf-8");
		this.sources = JSON.parse(raw);
	}

	public async addSource(sourceURI: string) {
		logger.spinner.start(`Adding source ${sourceURI}`);
		if (this.sources[sourceURI]) {
			throw new Error("Source already exists");
		}

		const type = sourceURI.split(":")[0];
		if (!SourceManager.validateType(type)) {
			throw new Error("Invalid source type");
		}

		const source = await SourceManager.validTypes[type].FromURI(sourceURI);
		this.sources[sourceURI] = source.get();
		this.save();

		logger.spinner.stop();
	}

	public getSources() {
		return this.sources;
	}

	static validateType(type: string | undefined): type is Source["type"] {
		return (
			type !== undefined &&
			Object.keys(SourceManager.validTypes).includes(type)
		);
	}
}
