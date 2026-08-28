import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import z from "zod";
import { GithubRepositorySource } from "@/config/GithubRepositorySource";
import { HttpFileSource } from "@/config/HttpFileSource";
import { IzumiError } from "@/error";
import { logger } from "@/logger";
import {
	type Source,
	type SourceFactory,
	type SourceWrapper,
	sourceSchema,
} from "@/types/Source";

export class SourceManager {
	private sources: Record<string, SourceWrapper>;
	private path: string;
	private log = logger.withTag("SourceManager");
	private static types: {
		[K in Source["type"]]: SourceFactory<
			SourceWrapper<Extract<Source, { type: K }>>
		>;
	} = {
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
		this.save();
	}

	private save() {
		try {
			const sources = Object.fromEntries(
				Object.entries(this.sources).map(([key, value]) => [
					key,
					value.get(),
				]),
			);
			writeFileSync(this.path, JSON.stringify(sources));
		} catch (e: unknown) {
			throw new IzumiError("Failed to save sources", e);
		}
	}

	private load() {
		const raw = readFileSync(this.path, "utf-8");
		let sources: Record<string, Source>;
		try {
			sources = z.record(z.string(), sourceSchema).parse(JSON.parse(raw));
		} catch (e: unknown) {
			throw new IzumiError("Failed to parse sources", e);
		}

		try {
			this.sources = Object.fromEntries(
				Object.entries(sources).map(
					([key, value]: [string, Source]) => [
						key,
						new (SourceManager.types[value.type] as SourceFactory)(
							value,
						),
					],
				),
			);
		} catch (e: unknown) {
			throw new IzumiError("Failed to load sources", e);
		}
	}

	public async addSource(sourceURI: string) {
		logger.spinner.start(`Adding source ${sourceURI}`);
		if (this.sources[sourceURI]) {
			throw new IzumiError("Source already exists");
		}

		const type = sourceURI.split(":")[0];
		if (!SourceManager.validateType(type)) {
			throw new IzumiError("Invalid source type");
		}

		const source = await SourceManager.types[type].FromURI(sourceURI);
		this.sources[sourceURI] = source;
		this.save();

		logger.spinner.stop();
		this.log.success(`Added source ${sourceURI}`);
	}

	public getSources() {
		return this.sources;
	}

	static validateType(type: string | undefined): type is Source["type"] {
		return (
			type !== undefined &&
			Object.keys(SourceManager.types).includes(type)
		);
	}
}
