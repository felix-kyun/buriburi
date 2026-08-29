import Table from "cli-table3";
import type { Command } from "commander";
import { config } from "@/config";
import { logger } from "@/logger";

export function registerSource(program: Command) {
	const source = program.command("source").description("Manage Sources");

	source
		.command("list")
		.description("List installed sources")
		.action(() => {
			const sources = config.sourceManager.getSources();
			if (Object.keys(sources).length === 0) {
				logger.error("No sources configured");
				return;
			}

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

	source
		.command("add")
		.description("Add new source")
		.argument("<uri>")
		.action(async (uri) => {
			await config.sourceManager.addSource(uri);
		});

	source
		.command("remove")
		.description("Remove a source")
		.argument("<uri>")
		.action(async (uri) => {
			await config.sourceManager.removeSource(uri);
		});
}
