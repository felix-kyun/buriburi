import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SourceManager } from "@/config/SourceManager";
import { APP_NAME } from "@/constants";

class Config {
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
					APP_NAME,
				);
			case "darwin":
				return join(homedir(), "Library", "Preferences", APP_NAME);
			case "linux":
				return join(
					process.env.XDG_CONFIG_HOME || join(homedir(), ".config", APP_NAME),
				);
			default:
				return join(homedir(), APP_NAME);
		}
	}
}

export const config = new Config();
