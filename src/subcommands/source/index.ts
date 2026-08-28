import type { Command } from "commander";
import { config } from "@/config";

export function registerSource(program: Command) {
	const source = program.command("source").description("Manage Sources");

	source
		.command("add")
		.description("Add new source")
		.argument("<repository>")
		.action(async (repository) => {
			await config.sourceManager.addSource(repository);
		});

	source
		.command("list")
		.description("List installed sources")
		.action(() => {
			const sources = config.sourceManager.getSources();

			// TODO: pretty print
			console.log(Object.keys(sources));
		});
}
