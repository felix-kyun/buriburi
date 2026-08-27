import {
	type ConsolaInstance,
	type ConsolaReporter,
	createConsola,
	LogLevels,
} from "consola";
import yoctoSpinner, { type Spinner } from "yocto-spinner";
import { IzumiError } from "@/error";

interface Logger extends ConsolaInstance {
	spinner: {
		spinner: Spinner;
		start: (text?: string) => void;
		stop: () => void;
	};
}

const spinner = yoctoSpinner();
export const logger: Logger = createConsola() as Logger;
const reporter = logger.options.reporters[0];

logger.spinner = {
	spinner,
	start: (text?: string) => spinner.start(text),
	stop: () => spinner.stop(),
};

// pause spinner while logging to avoid garbage
// hide stack trace for IzumiError in non-debug mode
// in case cause is present, include the reason in bracket, and copy stack trace
const customReporter: ConsolaReporter = {
	log: (logObj, ctx) => {
		const wasSpinning = spinner.isSpinning;

		if (wasSpinning) {
			spinner.stop();
		}

		reporter?.log(
			{
				...logObj,
				args: logObj.args.map((arg) => {
					if (arg instanceof IzumiError) {
						if (arg.cause instanceof Error) {
							arg.message = `${arg.message} (${arg.cause.name}: ${arg.cause.message})`;
							if (arg.cause.stack) {
								arg.stack = arg.cause.stack;
							}
							delete arg.cause;
						}

						if (logger.level < LogLevels.debug) {
							return arg.message;
						}

						return arg;
					}
					return arg;
				}),
			},
			ctx,
		);

		if (wasSpinning && logObj.level > LogLevels.error) {
			spinner.start();
		}
	},
};

logger.options.reporters = [customReporter];
