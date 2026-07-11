import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "prisma/config";

const config = {
	server: env("DB_HOST"),
	port: parseInt(env("DB_PORT")),
	database: env("DB_NAME"),
	user: env("DB_USER"),
	password: env("DB_PASSWORD"),
	options: {
		encrypt: true,
		trustServerCertificate: true,
	},
};

const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export { prisma };
