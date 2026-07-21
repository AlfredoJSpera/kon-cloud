import path from "path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	resolve: {
		tsconfigPaths: true,
		alias: {
			"@backend-interfaces": path.resolve(
				__dirname,
				"../backend/interfaces",
			),
		},
	},
});
