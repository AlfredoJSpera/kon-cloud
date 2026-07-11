import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: `sqlserver://${env("DB_HOST")}:${env("DB_PORT")};database=${env("DB_NAME")};user=${env("DB_USER")};password={${env("DB_PASSWORD")}};encrypt=true;trustServerCertificate=true;`,
	},
});
