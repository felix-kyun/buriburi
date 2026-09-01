import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Title, titleSchema } from "@type/Title";
import z from "zod";
import { config } from "@/config";
import { IzumiError } from "@/error";
import { assertNever } from "@/helpers";
import { logger } from "@/logger";

export class TitleManager {
	private file: string;
	private titles: Array<Title>;
	private log = logger.withTag("TitleManager");

	constructor(configDirectory: string) {
		this.file = join(configDirectory, "titles.json");
		this.titles = [];

		if (existsSync(this.file)) {
			this.load();
		} else {
			this.init();
		}
	}

	private init() {
		this.titles = [];
		this.save();
	}

	private load() {
		try {
			const raw = readFileSync(this.file, "utf-8");
			this.titles = z.array(titleSchema).parse(JSON.parse(raw));
		} catch (e: unknown) {
			throw new IzumiError("Failed to parse titles", e);
		}
	}

	private save() {
		try {
			writeFileSync(this.file, JSON.stringify(this.titles));
		} catch (e: unknown) {
			throw new IzumiError("Failed to save sources", e);
		}
	}

	async update() {
		logger.spinner.start("Updating titles");
		const titles: Array<Title> = [];
		for (const source of Object.values(config.sourceManager.getSources())) {
			for (const provider of source.manifest.get().providers) {
				switch (provider.kind) {
					case "static":
						titles.push(...provider.titles);
						break;
					case "cached":
					case "live":
						// TODO:
						break;
					default:
						assertNever(provider);
				}
			}
		}
		this.titles = titles;
		this.save();
		logger.spinner.stop();
		this.log.success("Updated sources");
	}

	public getTitles() {
		return this.titles;
	}

	public search(query: string) {
		return this.titles.filter((t) =>
			t.title.toLowerCase().includes(query.toLowerCase()),
		);
	}
}
