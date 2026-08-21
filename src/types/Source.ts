import type { Providers } from "@/types/Providers";

export interface Source {
	// Can be extended
	provider: Providers;
	name: string;
	data: string;
}
