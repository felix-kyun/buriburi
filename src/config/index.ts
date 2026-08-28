import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SourceManager } from "@/classes/SourceManager";
import { APP_NAME } from "@/constants";
import { logger } from "@/logger";

class Config {
	public sourceManager;

	constructor(appName: string) {
		const root = this.getConfigDirectory(appName);

		if (!existsSync(root)) {
			mkdirSync(root, {
				recursive: true,
			});
		}

		try {
			this.sourceManager = new SourceManager(root);
		} catch (e: unknown) {
			logger.error(e);
			process.exit(1);
		}
	}

	private getConfigDirectory(appName: string) {
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
					process.env.XDG_CONFIG_HOME ||
						join(homedir(), ".config", appName),
				);
			default:
				return join(homedir(), appName);
		}
	}
}

export const config = new Config(APP_NAME);
