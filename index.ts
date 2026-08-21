import * as cheerio from "cheerio";
import { BASE_URL } from "@/constants";
import {
	extractContinuationToken,
	extractEpisodes,
	fetchNextPage,
} from "@/subcommands/fetch/helpers";

const playlistId = "c4063937";

const playlistUrl = `${BASE_URL}/${playlistId}`;
const playlistPage = await fetch(playlistUrl);

let pageContent = await playlistPage.text();
let continuationToken;

do {
	const episodes = await extractEpisodes(pageContent);
	console.dir(episodes);

	continuationToken = await extractContinuationToken(pageContent);
	pageContent = await fetchNextPage(playlistUrl, continuationToken as string);
} while (continuationToken);
