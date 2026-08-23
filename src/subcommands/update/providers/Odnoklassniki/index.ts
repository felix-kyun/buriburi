import { decode } from "@cmd/update/providers/helpers";
import {
	extractContinuationToken,
	extractEpisodes,
	fetchNextPage,
	normalizeEpisodes,
} from "@cmd/update/providers/Odnoklassniki/helpers";
import type { ScrapedEpisode } from "@cmd/update/providers/Odnoklassniki/types";
import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";
import type { Nullable } from "@/types/Nullable";

export async function Odnoklassniki(data: string): Promise<Array<Episode>> {
	const id = decode(data);
	const log = logger.withTag(`provider/Odnoklasssniki/${id}`);
	const scrapedEpisodes: Array<ScrapedEpisode> = [];

	const baseUrl = `${decode("aHR0cHM6Ly9vay5ydS92aWRlbw==")}/${id}`;

	const playlistPage = await fetch(baseUrl);
	let pageContent = await playlistPage.text();
	let continuationToken: Nullable<string>;

	do {
		const extracted = await extractEpisodes(pageContent);
		scrapedEpisodes.push(...extracted);

		continuationToken = await extractContinuationToken(pageContent);
		pageContent = await fetchNextPage(baseUrl, continuationToken as string);
	} while (continuationToken);

	log.debug(`Scraped ${scrapedEpisodes.length} entries`);

	const normalizedEpisodes = normalizeEpisodes(scrapedEpisodes);
	log.debug(`Found ${normalizedEpisodes.length} episodes`);

	return normalizedEpisodes;
}
