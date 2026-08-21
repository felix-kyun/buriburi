import { BASE_URL } from "@/constants";
import type { Nullable } from "@/types";
import {
	extractContinuationToken,
	extractEpisodes,
	fetchNextPage,
} from "./helpers.js";

export default async function fetchPlaylist(playlistId: string) {
	const playlistUrl = `${BASE_URL}/${playlistId}`;
	const playlistPage = await fetch(playlistUrl);

	let pageContent = await playlistPage.text();
	let continuationToken: Nullable<string>;

	do {
		const episodes = await extractEpisodes(pageContent);
		console.dir(episodes);

		continuationToken = await extractContinuationToken(pageContent);
		pageContent = await fetchNextPage(
			playlistUrl,
			continuationToken as string,
		);
	} while (continuationToken);
}
