import { providers } from "@fetch/providers";
import { sources } from "@fetch/sources";
import type { Command } from "commander";
import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";

const log = logger.withTag("fetch");

async function fetchCommand() {
	const episodes: Array<Episode> = [];

	await Promise.all(
		sources.map(async (source) => {
			log.debug(`loading source "${source.name}"`);
			const results = await providers[source.provider](source.data);
			episodes.push(...results);
		}),
	);

	log.info(`loaded ${episodes.length} episodes`);
}

export function registerFetch(program: Command) {
	program
		.command("fetch")
		.description("Fetch and cache playlist videos")
		.action(fetchCommand);
}
