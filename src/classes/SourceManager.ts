import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GithubRepositorySource } from "@class/GithubRepositorySource";
import { HttpFileSource } from "@class/HttpFileSource";
import z from "zod";
import { IzumiError } from "@/error";
import { logger } from "@/logger";
import {
	type Source,
	type SourceFactory,
	type SourceType,
	type SourceWrapper,
	sourceSchema,
} from "@/types/Source";

export class SourceManager {
	private sources: Record<string, SourceWrapper>;
	private readonly file: string;
	private readonly store: string;
	private readonly log = logger.withTag("SourceManager");
	private static readonly types: {
		[K in Source["kind"]]: SourceFactory<SourceWrapper<SourceType<K>>>;
	} = {
		github: GithubRepositorySource,
		http: HttpFileSource,
	};

	constructor(configDirectory: string) {
		this.file = join(configDirectory, "sources.json");
		this.store = join(configDirectory, "sources.d");
		this.sources = {};

		if (!existsSync(this.file)) {
			mkdirSync(this.store, { recursive: true });
		}

		if (existsSync(this.file)) {
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
				Object.entries(this.sources).map(([id, value]) => [id, value.get()]),
			);
			writeFileSync(this.file, JSON.stringify(sources));
		} catch (e: unknown) {
			throw new IzumiError("Failed to save sources", e);
		}
	}

	private load() {
		const raw = readFileSync(this.file, "utf-8");
		let sources: Record<string, Source>;
		try {
			sources = z.record(z.string(), sourceSchema).parse(JSON.parse(raw));
		} catch (e: unknown) {
			throw new IzumiError("Failed to parse sources", e);
		}

		try {
			this.sources = Object.fromEntries(
				Object.entries(sources).map(([id, value]) => [
					id,
					SourceManager.types[value.kind].FromSource(
						join(this.store, value.id),
						value,
					),
				]),
			);
		} catch (e: unknown) {
			throw new IzumiError("Failed to load sources", e);
		}
	}

	public async addSource(uri: string) {
		logger.spinner.start(`Adding ${uri}`);

		const type = uri.split(":")[0];
		if (!SourceManager.validateType(type)) {
			throw new IzumiError("Invalid source type");
		}

		const source = await SourceManager.types[type].FromURI(uri);
		if (this.sources[source.id]) {
			throw new IzumiError("Source already exists");
		}

		await source.init();
		this.sources[source.id] = source;
		this.save();

		logger.spinner.stop();
		this.log.success(`Added source ${source.id}`);
	}

	public async removeSource(id: string) {
		logger.spinner.start(`Removing source ${id}`);
		const source = this.sources[id];

		if (!source) {
			throw new IzumiError("Source does not exist");
		}

		await source.remove();
		delete this.sources[id];
		this.save();

		logger.spinner.stop();
		this.log.success(`Removed source ${id}`);
	}

	public async updateSources() {
		logger.spinner.start("Updating sources");
		for (const source of Object.values(this.sources)) {
			await source.update();
			this.log.success(`Updated source ${source.get().id}`);
		}
		this.save();
		logger.spinner.stop();
		this.log.success("Updated sources");
	}

	public getSources() {
		return this.sources;
	}

	public getSourceStore() {
		return this.store;
	}

	static validateType(type: string | undefined): type is Source["kind"] {
		return (
			type !== undefined && Object.keys(SourceManager.types).includes(type)
		);
	}
}
