import type { Command } from "commander";
import { config } from "@/config";

export function registerTitle(program: Command) {
	const title = program.command("title").description("Manage Titles");

	title
		.command("search")
		.description("Search for titles")
		.argument("<query>")
		.action((query) => {
			console.log(config.titleManager.search(query));
		});

	title
		.command("update")
		.description("Update titles")
		.action(async () => {
			await config.titleManager.update();
		});
}
