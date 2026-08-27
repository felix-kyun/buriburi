import { logger } from "@/logger";
import type { Source } from "@/types/Source";

interface RepositoryMeta {
	etag: string;
	sha: string;
	files: Record<string, string>;
}

export class GithubRepositorySource {
	readonly id: string;
	readonly uri: string;
	readonly type = "github" as const;
	readonly sha: string;
	readonly etag: string;
	readonly files: Record<string, string>;

	constructor(source: Extract<Source, { type: "github" }>) {
		this.id = source.id;
		this.uri = source.uri;
		this.sha = source.sha;
		this.etag = source.etag;
		this.files = source.files;
	}

	public get(): Extract<Source, { type: "github" }> {
		return {
			id: this.id,
			type: this.type,
			uri: this.uri,
			sha: this.sha,
			etag: this.etag,
			files: this.files,
		};
	}

	public static async FromURI(sourceURI: string) {
		const remote = await GithubRepositorySource.fetchRemote(sourceURI);

		return new GithubRepositorySource({
			id: crypto.randomUUID(),
			type: "github",
			uri: sourceURI,
			...remote,
		});
	}

	private static async fetchRemote(
		sourceURI: string,
	): Promise<RepositoryMeta>;
	private static async fetchRemote(
		sourceURI: string,
		etag: string,
	): Promise<RepositoryMeta | null>;

	private static async fetchRemote(sourceURI: string, etag?: string) {
		try {
			const { owner, repo, ref } =
				GithubRepositorySource.parseSourceURI(sourceURI);

			const headers: Record<string, string> = {
				Accept: "application/vnd.github+json",
			};

			if (etag) {
				headers["If-None-Match"] = etag;
			}

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
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

	private static parseSourceURI(sourceString: string) {
		const match = sourceString.match(
			/^(?<type>[a-z]+):(?<owner>[^/]+)\/(?<repo>[^@]+)@(?<ref>.+)$/,
		);

		if (!match?.groups) {
			throw new Error(
				"Invalid source repository string. Format 'github:owner/repo@ref'",
			);
		}

		return match.groups as unknown as {
			type: string;
			owner: string;
			repo: string;
			ref: string;
		};
	}
}
