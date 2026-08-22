import { logger } from "@/logger";
import type { Episode } from "@/types/Episode";
import type { Nullable } from "@/types/Nullable";
import { decode } from "@update/providers/helpers";
import {
	extractContinuationToken,
	extractEpisodes,
	fetchNextPage,
} from "@update/providers/Odnoklassniki/helpers";

const log = logger.withTag("provider/Odnoklasssniki");

export async function Odnoklassniki(data: string): Promise<Array<Episode>> {
	const episodes: Array<Episode> = [];

	const id = decode(data);
	const baseUrl = `${decode("aHR0cHM6Ly9vay5ydS92aWRlbw==")}/${id}`;

	const playlistPage = await fetch(baseUrl);
	let pageContent = await playlistPage.text();
	let continuationToken: Nullable<string>;

	do {
		episodes.push(...(await extractEpisodes(pageContent)));

		continuationToken = await extractContinuationToken(pageContent);
		pageContent = await fetchNextPage(baseUrl, continuationToken as string);
	} while (continuationToken);

	log.withTag(id).debug(`fetched ${episodes.length} episodes`);

	return episodes;
}
