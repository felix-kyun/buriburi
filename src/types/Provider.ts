import * as z from "zod";
import { titleSchema } from "@/types/Title";

const baseSchema = z.object({
	kind: z.string(),
});

const providerPermissionsSchema = z.object({
	network: z.array(z.string()),
});

const staticProviderSchema = baseSchema.extend({
	kind: z.literal("static"),
	encoding: z.union([z.literal("none"), z.literal("base64")]),
	titles: z.array(titleSchema),
});

const cachedProviderSchema = baseSchema.extend({
	kind: z.literal("cached"),
	script: z.string(),
	permissions: providerPermissionsSchema.optional(),
});

const liveProviderSchema = baseSchema.extend({
	kind: z.literal("live"),
	script: z.string(),
	permissions: providerPermissionsSchema.optional(),
});

export const providerSchema = z.discriminatedUnion("kind", [
	staticProviderSchema,
	cachedProviderSchema,
	liveProviderSchema,
]);

export type Provider = z.infer<typeof providerSchema>;
