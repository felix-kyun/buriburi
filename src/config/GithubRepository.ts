import { logger } from "@/logger";
import type { PartialSource } from "@/types/PartialSource";
import type { Repository } from "@/types/Repository";

interface Remote {
	etag: string;
	sha: string;
	files: Record<string, string>;
}

export class GithubRepository {
	private constructor(private readonly repo: Repository) {}

	public get() {
		return this.repo;
	}

	public getSha() {
		return this.repo.sha;
	}

	public static async new(partialSource: PartialSource) {
		const remote = await GithubRepository.fetchRemote(partialSource);

		return new GithubRepository({
			...remote,
			...partialSource,
		});
	}

	private static async fetchRemote(
		partialSource: PartialSource,
	): Promise<Remote>;
	private static async fetchRemote(
		partialSource: PartialSource,
		etag: string,
	): Promise<Remote | null>;

	private static async fetchRemote(
		partialSource: PartialSource,
		etag?: string,
	) {
		try {
			const headers: Record<string, string> = {
				Accept: "application/vnd.github+json",
			};

			if (etag) {
				headers["If-None-Match"] = etag;
			}

			const response = await fetch(
				`https://api.github.com/repos/${partialSource.owner}/${partialSource.repo}/git/trees/${partialSource.ref}?recursive=1`,
				{
					headers,
				},
			);

			if (response.status === 304) {
				return null;
			}

			const { sha, tree } = (await response.json()) as {
				sha: string;
				tree: Array<{
					path: string;
					type: string;
					sha: string;
				}>;
			};

			return {
				etag: response.headers.get("etag"),
				sha,
				files: tree
					.filter((item) => item.type === "blob")
					.reduce(
						(acc, { path, sha }) => {
							acc[path] = sha;
							return acc;
						},
						{} as Record<string, string>,
					),
			};
		} catch (error: unknown) {
			logger.withTag("GithubRepository").error(error);
		}
	}
}
