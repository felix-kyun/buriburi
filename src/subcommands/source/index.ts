import Table from "cli-table3";
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
			const table = new Table({
				chars: {
					"top-left": "╭",
					"top-right": "╮",
					"bottom-left": "╰",
					"bottom-right": "╯",
				},
				head: ["Type", "Source id", "URI"],
			});

			Object.values(sources).forEach(({ id, type, uri }) => {
				table.push([type, id, uri]);
			});

			console.log(table.toString());
		});
}
