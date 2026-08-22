import { Odnoklassniki } from "@cmd/update/providers/Odnoklassniki";
import type { Episode } from "@/types/Episode";
import type { Providers } from "@/types/Providers";

export const providers: Record<
	Providers,
	(data: string) => Promise<Array<Episode>>
> = {
	Odnoklassniki,
};
