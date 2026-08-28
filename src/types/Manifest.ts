import { providerSchema } from "@type/Provider";
import { z } from "zod";

export const manifestSchema = z.object({
	id: z.string(),
	name: z.string(),
	providers: z.array(providerSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;
