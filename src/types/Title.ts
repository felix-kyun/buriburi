import * as z from "zod";

export const directStreamSchema = z.object({
	kind: z.literal("direct"),
	url: z.string(),
	info: z.string().optional(),
	headers: z.record(z.string(), z.string()).optional(),
});

export const refStreamSchema = z.object({
	kind: z.literal("lazy"),
	ref: z.string(),
});

export const partSchema = z.object({
	title: z.string(),
	streams: z.array(
		z.discriminatedUnion("kind", [directStreamSchema, refStreamSchema]),
	),
});

export const episodeSchema = z.object({
	id: z.string(),
	episode: z.number(),
	season: z.number().optional(),
	title: z.string().optional(),
	summary: z.string().optional(),
	parts: z.array(partSchema),
});

export const titleSchema = z.object({
	id: z.string(),
	kind: z.union([z.literal("movie"), z.literal("series")]),
	title: z.string(),
	altTitles: z.array(z.string()).optional(),
	year: z.string().optional(),
	poster: z.string().optional(),
	description: z.string().optional(),
	genres: z.array(z.string()).optional(),
	episodes: z.array(episodeSchema),
});

export type DirectStream = z.infer<typeof directStreamSchema>;
export type RefStream = z.infer<typeof refStreamSchema>;
export type Part = z.infer<typeof partSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type Title = z.infer<typeof titleSchema>;
