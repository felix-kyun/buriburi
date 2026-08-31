import * as z from "zod";

const baseSourceSchema = z.object({
	id: z.string(),
	type: z.string(),
	uri: z.string(),
});

const githubRepositorySourceSchema = baseSourceSchema.extend({
	type: z.literal("github"),
	sha: z.hash("sha1"),
	etag: z.string().nullable(),
	files: z.record(z.string(), z.string()),
});

const httpFileSource = baseSourceSchema.extend({
	type: z.literal("http"),
	etag: z.string().nullable(),
});

export const sourceSchema = z.discriminatedUnion("type", [
	githubRepositorySourceSchema,
	httpFileSource,
]);

export type Source = z.infer<typeof sourceSchema>;
export type SourceType<T extends Source["type"]> = Extract<Source, { type: T }>;

export type SourceWrapper<T extends Source = Source> = T & {
	get: () => T;
	init: () => Promise<void>;
	update: () => Promise<void>;
	remove: () => Promise<void>;
};

export type SourceFactory<T extends SourceWrapper = SourceWrapper> = {
	FromURI(uri: string): Promise<T>;
	FromSource(path: string, source: Source): T;
};
