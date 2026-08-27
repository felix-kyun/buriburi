import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GithubRepository } from "@/config/GithubRepository";
import { logger } from "@/logger";
import type { PartialSource } from "@/types/PartialSource";
import type { Source } from "@/types/Source";

// TODO: add lazy loading
// TODO: add runtime schema validation

export class SourceManager {
	private sources: Record<string, Source>;
	private path: string;
	private log = logger.withTag("SourceManager");

	constructor(configDirectory: string) {
		this.path = join(configDirectory, "sources.json");
		this.sources = {};

		if (existsSync(this.path)) {
			const raw = readFileSync(this.path, "utf-8");
			this.sources = JSON.parse(raw);
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

	private parseRepositoryString(sourceString: string): PartialSource {
		const match = sourceString.match(
			/^(?<type>[a-z]+):(?<owner>[^/]+)\/(?<repo>[^@]+)@(?<ref>.+)$/,
		);

		if (!match?.groups) {
			throw new Error(
				"Invalid source repository string. Format 'type:owner/repo@ref'",
			);
		}

		return match.groups as unknown as PartialSource;
	}

	public async addSource(sourceString: string) {
		logger.spinner.start(`Adding source ${sourceString}`);
		if (this.sources[sourceString]) {
			throw new Error("Source already exists");
		}

		const partialSource = this.parseRepositoryString(sourceString);
		this.log.debug(partialSource);

		if (partialSource.type !== "github") {
			throw new Error("Only github sources are supported");
		}

		const repo = await GithubRepository.new(partialSource);
		this.log.debug(repo);

		this.sources[sourceString] = repo.get();
		this.save();

		logger.spinner.stop();
	}

	public getSources() {
		return this.sources;
	}
}
