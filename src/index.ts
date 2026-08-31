/*
 * Author:   Praise Jacob <iampraisejacob@gmail.com>
 * Repo:     https://github.com/felix-kyun/buriburi
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Praise Jacob
 */

import { registerSource } from "@cmd/source";
import { Command } from "commander";
import packageJson from "@/../package.json" with { type: "json" };
import { APP_NAME } from "@/constants";
import { logger } from "@/logger";

const subCommands: Array<(program: Command) => void> = [registerSource];

const program = new Command()
	.name(APP_NAME)
	.description("")
	.version(packageJson.version, "-v, --version", "Print the version number");

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
