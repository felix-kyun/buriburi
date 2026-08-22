import { providers } from "@update/providers";
import { sources } from "@update/sources";
import type { Command } from "commander";
import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";
import { config } from "@/config";

/*
 * buriburi fetch
 */

const log = logger.withTag("fetch");

async function updateCommand() {
	const episodes: Array<Episode> = [];

	log.start("Updating Registry");
	try {
		await Promise.all(
			sources.map(async (source) => {
				log.debug(`loading source "${source.name}"`);
				const results = await providers[source.provider](source.data);
				episodes.push(...results);
			}),
		);

		config.setEpisodes(episodes);
		log.success(`Saved ${episodes.length} episodes`);
	} catch (error) {
		log.fatal(error);
	}
}

export function registerUpdate(program: Command) {
	program
		.command("update")
		.description("Update Registry")
		.action(updateCommand);
}
