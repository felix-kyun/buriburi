import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ManifestWrapper } from "@/classes/ManifestWrapper";
import { IzumiError } from "@/error";
import type { Source, SourceType, SourceWrapper } from "@/types/Source";

export class GithubRepositorySource implements SourceWrapper<
	SourceType<"github">
> {
	readonly id: string;
	readonly uri: string;
	readonly type = "github" as const;
	readonly sha: string;
	readonly etag: string;
	readonly files: Record<string, string>;
	readonly manifest: ManifestWrapper;

	private constructor(
		source: SourceType<"github">,
		manifest: ManifestWrapper,
	) {
		this.id = source.id;
		this.uri = source.uri;
		this.sha = source.sha;
		this.etag = source.etag;
		this.files = source.files;
		this.manifest = manifest;
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

	public static async FromURI(uri: string) {
		const { owner, repo, ref } = GithubRepositorySource.parseSourceURI(uri);
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
			{
				headers: {
					Accept: "application/vnd.github+json",
				},
			},
		);

		if (!response.ok) {
			throw new IzumiError("Failed to fetch repository");
		}

		const { sha, tree } = (await response.json()) as {
			sha: string;
			tree: Array<{
				path: string;
				type: string;
				sha: string;
			}>;
		};

		const files = tree
			.filter((item) => item.type === "blob")
			.reduce(
				(acc, { path, sha }) => {
					acc[path] = sha;
					return acc;
				},
				{} as Record<string, string>,
			);

		if (!files["manifest.json"]) {
			throw new IzumiError("Manifest not found in repository");
		}

		const rawManifest = await fetch(
			`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/manifest.json`,
		);

		let manifest: ManifestWrapper;
		try {
			manifest = ManifestWrapper.fromJson(await rawManifest.json());
		} catch (e) {
			throw new IzumiError("Failed to parse manifest", e);
		}

		return new this(
			{
				id: manifest.get().id,
				type: "github",
				uri: uri,
				etag: response.headers.get("etag") ?? "",
				sha,
				files,
			},
			manifest,
		);
	}

	public static FromSource(
		sourceDirectory: string,
		source: SourceType<"github">,
	) {
		const path = join(sourceDirectory, "manifest.json");

		const raw = readFileSync(path, "utf-8");
		const manifest = ManifestWrapper.fromJson(JSON.parse(raw));

		return new this(source, manifest);
	}

	public async init() {}

	public async update() {}

	public async remove() {}

	// private static async fetchRemote(
	// 	sourceURI: string,
	// ): Promise<RepositoryMeta>;
	// private static async fetchRemote(
	// 	sourceURI: string,
	// 	etag: string,
	// ): Promise<RepositoryMeta | null>;

	// private static async fetchRemote(uri: string, etag?: string) {
	// 	try {
	// 		const { owner, repo, ref } =
	// 			GithubRepositorySource.parseSourceURI(uri);

	// 		const headers: Record<string, string> = {
	// 			Accept: "application/vnd.github+json",
	// 		};

	// 		if (etag) {
	// 			headers["If-None-Match"] = etag;
	// 		}

	// 		const response = await fetch(
	// 			`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
	// 			{
	// 				headers,
	// 			},
	// 		);

	// 		if (response.status === 304) {
	// 			return null;
	// 		}

	// 		const { sha, tree } = (await response.json()) as {
	// 			sha: string;
	// 			tree: Array<{
	// 				path: string;
	// 				type: string;
	// 				sha: string;
	// 			}>;
	// 		};

	// 		return {
	// 			etag: response.headers.get("etag"),
	// 			sha,
	// 			files: tree
	// 				.filter((item) => item.type === "blob")
	// 				.reduce(
	// 					(acc, { path, sha }) => {
	// 						acc[path] = sha;
	// 						return acc;
	// 					},
	// 					{} as Record<string, string>,
	// 				),
	// 		};
	// 	} catch (error: unknown) {
	// 		logger.withTag("GithubRepository").error(error);
	// 	}
	// }

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
