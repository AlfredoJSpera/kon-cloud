import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@generated/prisma/client";
import { DB_CONFIG } from "@utils/envVariables";

const config = {
	server: DB_CONFIG.host,
	port: DB_CONFIG.port,
	database: DB_CONFIG.databaseName,
	user: DB_CONFIG.user,
	password: DB_CONFIG.password,
	options: {
		encrypt: DB_CONFIG.encrypt,
		trustServerCertificate: DB_CONFIG.trustServerCertificate,
	},
};

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export { prisma };
