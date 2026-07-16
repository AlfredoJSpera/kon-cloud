import { DB_CONNECTION_STRING } from "@utils/envVariables";
import { defineConfig } from "prisma/config";

export default defineConfig({
	// https://www.prisma.io/docs/orm/prisma-schema/overview/location
	schema: "prisma/schema.prisma",
	// https://www.prisma.io/docs/orm/prisma-migrate
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: DB_CONNECTION_STRING,
	},
});
