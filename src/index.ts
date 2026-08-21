/*
 * Author:   Praise Jacob <iampraisejacob@gmail.com>
 * Repo:     https://github.com/felix-kyun/buriburi
 *
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Praise Jacob
 */

import { Command } from "commander";
import fetchPlaylist from "@/subcommands/fetch";

const program = new Command();

program.name("buriburi");
program.description("");
program.version("0.0.1", "-v, --version", "Print the version number");

program
	.command("fetch")
	.description("Fetch and cache playlist videos")
	.argument("<playlist_id>", "Playlist ID to fetch")
	.action(async (playlist_id: string) => {
		await fetchPlaylist(playlist_id);
	});

await program.parseAsync();
