import type { Nullable } from "@/types/Nullable";

export interface EpisodePart {
	id: string;
	title: string;
	part: Nullable<string>;
	duration: string;
}

export interface Episode {
	episode: number;
	parts: Array<EpisodePart>;
}
