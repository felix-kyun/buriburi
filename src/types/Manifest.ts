import { z } from "zod";
import { providerSchema } from "@/types/Provider";

export const manifestSchema = z.object({
	id: z.string(),
	name: z.string(),
	providers: z.array(providerSchema),
});

export type Manifest = z.infer<typeof manifestSchema>;
