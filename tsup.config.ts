import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	platform: "node",
	target: "node22",
	format: "esm",
	shims: true,
	banner: {
		js: "#!/usr/bin/env node",
	},
	bundle: true,
	// noExternal: [/.*/],
	skipNodeModulesBundle: true,
	dts: false,
	clean: true,
	sourcemap: true,
	minify: false,
});
