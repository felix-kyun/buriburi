import { readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ManifestWrapper } from "@class/ManifestWrapper";
import type { Nullable } from "@type/Nullable";
import type { Source, SourceType, SourceWrapper } from "@type/Source";
import { StatusCodes } from "http-status-codes";
import { config } from "@/config";
import { IzumiError } from "@/error";
import { logger } from "@/logger";

// TODO: orphaned script cleanup on update

export class GithubRepositorySource
	implements SourceWrapper<SourceType<"github">>
{
	readonly id: string;
	readonly uri: string;
	readonly type = "github" as const;
	sha: string;
	etag: Nullable<string>;
	files: Record<string, string>;
	manifest: ManifestWrapper;
	static readonly log = logger.withTag("GithubRepositorySource");

	private constructor(source: SourceType<"github">, manifest: ManifestWrapper) {
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

		const scriptFiles = manifest
			.get()
			.providers.filter((p) => p.kind !== "static")
			.map((p) => p.script)
			.reduce(
				(acc, script) => {
					const hash = files[script];
					if (!hash) {
						throw new IzumiError(
							`provider dependency ${script} not found in repository`,
						);
					}
					acc[script] = hash;
					return acc;
				},
				{} as Record<string, string>,
			);

		return new this(
			{
				id: manifest.get().id,
				type: "github",
				uri: uri,
				etag: response.headers.get("etag") ?? null,
				sha,
				files: {
					...scriptFiles,
					"manifest.json": files["manifest.json"],
				},
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

	public async init() {
		const dir = join(config.sourceManager.getSourceStore(), this.id);
		await mkdir(dir, {
			recursive: true,
		});

		await writeFile(
			join(dir, "manifest.json"),
			JSON.stringify(this.manifest.get()),
		);

		const scriptFiles = this.manifest
			.get()
			.providers.filter((p) => p.kind !== "static")
			.map((p) => p.script);

		const { owner, repo } = GithubRepositorySource.parseSourceURI(this.uri);

		await Promise.all(
			scriptFiles.map(async (script) => {
				const response = await fetch(
					`https://raw.githubusercontent.com/${owner}/${repo}/${this.sha}/${script}`,
				);
				if (!response.ok) {
					throw new IzumiError(`Failed to fetch script ${script}`);
				}
				const file = await response.text();
				const path = join(dir, script);
				await mkdir(dirname(path), { recursive: true });
				await writeFile(path, file);
			}),
		);
	}

	public async update() {
		GithubRepositorySource.log.debug(`Updating source ${this.id}`);
		const { owner, repo, ref } = GithubRepositorySource.parseSourceURI(
			this.uri,
		);

		const headers: Record<string, string> = {
			Accept: "application/vnd.github+json",
		};

		if (this.etag) {
			headers["If-None-Match"] = this.etag;
		}

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
			{
				headers,
			},
		);

		if (response.status === StatusCodes.NOT_MODIFIED) {
			GithubRepositorySource.log.debug("Upstream not modified (304)");
			return;
		}

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

		if (sha === this.sha) {
			GithubRepositorySource.log.debug("No new commits found");
			return;
		}

		const fileHash = tree
			.filter((item) => item.type === "blob")
			.reduce(
				(acc, { path, sha }) => {
					acc[path] = sha;
					return acc;
				},
				{} as Record<string, string>,
			);

		if (!fileHash["manifest.json"]) {
			throw new IzumiError("Manifest not found in repository");
		}

		const dir = join(config.sourceManager.getSourceStore(), this.id);
		let manifest: ManifestWrapper;

		if (fileHash["manifest.json"] === this.files["manifest.json"]) {
			GithubRepositorySource.log.debug("Manifest not updated");
			manifest = this.manifest;
		} else {
			const rawManifest = await fetch(
				`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/manifest.json`,
			);

			try {
				manifest = ManifestWrapper.fromJson(await rawManifest.json());
			} catch (e) {
				throw new IzumiError("Failed to parse manifest", e);
			}
		}

		const scriptFiles = manifest
			.get()
			.providers.filter((p) => p.kind !== "static")
			.map((p) => p.script)
			.reduce(
				(acc, script) => {
					const hash = fileHash[script];
					// ensure script exists
					if (!hash) {
						throw new IzumiError(
							`provider dependency ${script} not found in repository`,
						);
					}
					acc[script] = hash;
					return acc;
				},
				{} as Record<string, string>,
			);

		await Promise.all(
			Object.keys(scriptFiles)
				// only keep new/updated script
				.filter((script) => {
					return !this.files[script] || this.files[script] !== fileHash[script];
				})
				// fetch each script
				.map(async (script) => {
					const response = await fetch(
						`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${script}`,
					);
					if (!response.ok) {
						throw new IzumiError(`Failed to fetch script ${script}`);
					}
					const file = await response.text();
					const path = join(dir, script);
					await mkdir(dirname(path), { recursive: true });
					await writeFile(path, file);
				}),
		);

		await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest.get()));

		this.manifest = manifest;
		this.sha = sha;
		this.etag = response.headers.get("etag") ?? null;
		this.files = {
			...scriptFiles,
			"manifest.json": fileHash["manifest.json"],
		};
	}

	public async remove() {
		const dir = join(config.sourceManager.getSourceStore(), this.id);
		await rm(dir, { recursive: true, force: true });
	}

	private static parseSourceURI(uri: string) {
		const match = uri.match(
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
