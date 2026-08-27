import * as z from "zod";

const baseSourceSchema = z.object({
	id: z.uuid(),
	type: z.string(),
	uri: z.string(),
});

const githubRepositorySourceSchema = baseSourceSchema.extend({
	type: z.literal("github"),
	sha: z.hash("sha1"),
	etag: z.string(),
	files: z.record(z.string(), z.string()),
});

const httpFileSource = baseSourceSchema.extend({
	type: z.literal("http"),
});

export const sourceSchema = z.discriminatedUnion("type", [
	githubRepositorySourceSchema,
	httpFileSource,
]);

export type Source = z.infer<typeof sourceSchema>;

export type SourceWrapper<T extends Source = Source> = T & {
	get: () => T;
};

export type SourceFactory<T extends SourceWrapper = SourceWrapper> = {
	FromURI(uri: string): Promise<T>;
};
