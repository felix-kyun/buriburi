import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SourceManager } from "@/config/SourceManager";
import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";

const appName = "buriburi";

class Config {
	private log = logger.withTag("config");
	public sourceManager;

	constructor() {
		if (!existsSync(this.getConfigDirectory())) {
			mkdirSync(this.getConfigDirectory(), {
				recursive: true,
			});
		}

		this.sourceManager = new SourceManager(this.getConfigDirectory());
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

	public getEpisodes(): Array<Episode> {
		return [];
	}
}

export const config = new Config();
