import path from "path";
import { defineConfig } from "vitest/config";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	resolve: {
		tsconfigPaths: true,
		alias: {
			"@backend-interfaces": path.resolve(__dirname, "../interfaces"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		environmentOptions: {
			jsdom: {
				url: "http://localhost:3000",
			},
		},
	},
});
