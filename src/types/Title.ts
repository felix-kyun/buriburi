import * as z from "zod";

export const titleSchema = z.object({
	id: z.string(),
	kind: z.union([z.literal("movie"), z.literal("series")]),
	title: z.string(),
	altTitles: z.array(z.string()).optional(),
	year: z.string().optional(),
	poster: z.string().optional(),
	description: z.string().optional(),
	genres: z.array(z.string()).optional(),
	episodes: z.array(
		z.object({
			episode: z.number(),
			season: z.number().optional(),
			title: z.string().optional(),
			summary: z.string().optional(),
			parts: z.array(
				z.object({
					title: z.string(),
					streams: z.array(
						z.discriminatedUnion("kind", [
							z.object({
								kind: z.literal("direct"),
								url: z.string(),
								info: z.string().optional(),
								headers: z
									.record(z.string(), z.string())
									.optional(),
							}),
							z.object({
								kind: z.literal("lazy"),
								ref: z.string(),
							}),
						]),
					),
				}),
			),
		}),
	),
});

export type Title = z.infer<typeof titleSchema>;
