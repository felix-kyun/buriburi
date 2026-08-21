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

export async function extractEpisodes(pageContent: string): Promise<Episode[]> {
	const $ = cheerio.load(pageContent);
	const episodes: Episode[] = [];

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

		const preview = $(el).children("img").attr("src") ?? "";

		episodes.push({
			title,
			duration,
			id,
			preview,
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
