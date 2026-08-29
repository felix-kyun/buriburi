/*
 * Author:   Praise Jacob <iampraisejacob@gmail.com>
 * Repo:     https://github.com/felix-kyun/buriburi
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Praise Jacob
 */

import { registerSource } from "@cmd/source";
import { Command } from "commander";
import { LogLevels } from "consola";
import packageJson from "@/../package.json" with { type: "json" };
import { APP_NAME } from "@/constants";
import { logger } from "@/logger";

const subCommands: Array<(program: Command) => void> = [registerSource];

const program = new Command()
	.name(APP_NAME)
	.description("")
	.option("-d, --debug", "Enable debug logs")
	.version(packageJson.version, "-v, --version", "Print the version number");

program.hook("preAction", (thisCommand, _actionCommand) => {
	if (thisCommand.opts().debug) {
		logger.level = LogLevels.debug;
	}
});

subCommands.forEach((register) => {
	register(program);
});

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled rejection", reason);
	process.exitCode = 1;
});

try {
	await program.parseAsync();
} catch (error: unknown) {
	logger.error(error);
}
