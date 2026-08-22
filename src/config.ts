import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";

const appName = "buriburi";
const log = logger.withTag("config");

class Config {
	private episodes: Array<Episode> = [];

	constructor() {
		if (!existsSync(this.getConfigDirectory())) {
			mkdirSync(this.getConfigDirectory(), {
				recursive: true,
			});
		}

		this.loadEpisodes();
	}

	private getConfigDirectory(): string {
		switch (process.platform) {
			case "win32":
				return join(
					process.env.APPDATA || join(homedir(), "AppData", "Local"),
					appName,
				);
			case "darwin":
				return join(homedir(), "Library", "Preferences", appName);
			case "linux":
				return join(
					process.env.XDG_CONFIG_HOME || join(homedir(), ".config", appName),
				);
			default:
				return join(homedir(), appName);
		}
	}

	private getEpisodeRegistry() {
		return join(this.getConfigDirectory(), "episodes.json");
	}

	public getEpisodes(): Array<Episode> {
		return this.episodes;
	}

	private loadEpisodes(): void {
		const episodeRegistry = this.getEpisodeRegistry();

		if (!existsSync(episodeRegistry)) {
			log.error(
				"Episode registry not found. Please run `buriburi update` to create one.",
			);
			return;
		}

		// todo: add zod to validate

		const data = JSON.parse(readFileSync(episodeRegistry, "utf-8"));
		this.episodes = data;
	}

	public setEpisodes(episodes: Array<Episode>): void {
		this.episodes = episodes;
		this.saveEpisodes();
	}

	private saveEpisodes(): void {
		const episodeRegistry = this.getEpisodeRegistry();

		writeFileSync(episodeRegistry, JSON.stringify(this.episodes), "utf-8");
	}
}

export const config = new Config();
