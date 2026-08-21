/*
 * Author:   Praise Jacob <iampraisejacob@gmail.com>
 * Repo:     https://github.com/felix-kyun/buriburi
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Praise Jacob
 */

import { Command } from "commander";
import { registerFetch } from "@/subcommands/fetch";
import packageJson from "@/../package.json" with { type: "json" };

const program = new Command();
const commands: Array<(program: Command) => void> = [registerFetch];

program.name("buriburi");
program.description("");
program.version(
	packageJson.version,
	"-v, --version",
	"Print the version number",
);

commands.forEach((register) => register(program));

await program.parseAsync();
