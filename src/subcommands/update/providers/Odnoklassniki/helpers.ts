import type { ScrapedEpisode } from "@cmd/update/providers/Odnoklassniki/types";
import * as cheerio from "cheerio";
import type { Episode } from "@/types/Episode";
import type { Nullable } from "@/types/Nullable";

export async function extractContinuationToken(
	pageContent: string,
): Promise<Nullable<string>> {
	const $ = cheerio.load(pageContent);

	const continuationToken = $('div.loader-container[data-module="Loader"]')
		?.attr("data-last-element")
		?.trim();

	return continuationToken ?? null;
}

export async function extractEpisodes(
	pageContent: string,
): Promise<Array<ScrapedEpisode>> {
	const $ = cheerio.load(pageContent);
	const episodes: Array<ScrapedEpisode> = [];

	$("a.video-card_lk").each((_, el) => {
		const href = $(el).attr("href")?.split("?")[0];
		const id = href?.split("/").pop()?.trim();
		if (!id) return;

		const duration = $(el)
			.parent()
			.find("div.video-card_duration")
			.text()
			.trim();

		const title =
			$(el).children("img").attr("alt") ??
			$(el).parent().parent().find("a.video-card_n").attr("title") ??
			"";

		// const preview = $(el).children("img").attr("src") ?? "";

		episodes.push({
			title,
			duration,
			id,
		});
	});

	return episodes;
}

export async function fetchNextPage(
	baseUrl: string,
	continuationToken: string,
): Promise<string> {
	const res = await fetch(baseUrl, {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: `st.lastelem=${continuationToken}`,
		method: "POST",
	});

	return await res.text();
}

export function normalizeEpisodes(episodes: Array<ScrapedEpisode>) {
	const episodeMap = new Map<number, Episode>();

	episodes.forEach((episode) => {
		const match = episode.title.match(
			/(?<episodeNumber>\d+)(?<partId>\w)?/,
		);

		if (!match?.groups?.episodeNumber) {
			// todo: push to fail queue
			return;
		}

		const episodeNumber = Number(match.groups.episodeNumber);
		const partId = match.groups.partId ?? null;

		if (!episodeMap.has(episodeNumber)) {
			episodeMap.set(episodeNumber, {
				episode: episodeNumber,
				parts: [],
			});
		}

		episodeMap.get(episodeNumber)?.parts.push({
			id: episode.id,
			title: episode.title,
			duration: episode.duration,
			part: partId,
		});
	});

	return Array.from(episodeMap.values());
}
