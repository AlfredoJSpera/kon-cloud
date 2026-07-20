import "dotenv/config";

export function getEnv(key: string, defaultValue?: string): string {
	let value = process.env[key];
	if (value === undefined || value === "") {
		if (defaultValue === undefined) {
			throw new Error(
				`"${key}" is required but was not found as an environment variable.`,
			);
		}
		value = defaultValue;
	}
	return value;
}

export function parseBoolean(str: string) {
	return str.toLowerCase() === "true";
}

// Database
const DB_HOST = getEnv("DB_HOST");
const DB_PORT = parseInt(getEnv("DB_PORT"), 10);
const DB_NAME = getEnv("DB_NAME");
const DB_USER = getEnv("DB_USER");
const DB_PASSWORD = getEnv("DB_PASSWORD");
const DB_ENCRYPT = parseBoolean(getEnv("DB_ENCRYPT", "true"));
const DB_TRUST_SERVER_CERTIFICATE = parseBoolean(
	getEnv("DB_TRUST_SERVER_CERTIFICATE", "true"),
);

export const DB_CONFIG = {
	host: DB_HOST,
	port: DB_PORT,
	databaseName: DB_NAME,
	user: DB_USER,
	password: DB_PASSWORD,
	encrypt: DB_ENCRYPT,
	trustServerCertificate: DB_TRUST_SERVER_CERTIFICATE,
};

export const DB_CONNECTION_STRING = `sqlserver://${DB_HOST}:${DB_PORT};database=${DB_NAME};user=${DB_USER};password={${DB_PASSWORD}};encrypt=${DB_ENCRYPT};trustServerCertificate=${DB_TRUST_SERVER_CERTIFICATE};`;

// Server config
export const SV_PORT = parseInt(getEnv("SV_PORT", "3000"), 10);
export const SV_LOG_LEVEL = getEnv("SV_LOG_LEVEL", "info");

// Limiters
export const GENERAL_LIMITER_WINDOW = getEnv("GENERAL_LIMITER_WINDOW", "15m");
export const GENERAL_LIMITER_REQUESTS = parseInt(
	getEnv("GENERAL_LIMITER_REQUESTS", "200"),
	10,
);
export const GENERAL_LIMITER_HIDE_HEADERS = parseBoolean(
	getEnv("GENERAL_LIMITER_HIDE_HEADERS", "true"),
)
	? false
	: "draft-7";

export const GENERAL_LIMITER_TRUST_PROXY = parseBoolean(
	getEnv("GENERAL_LIMITER_TRUST_PROXY", "false"),
);

export const AUTH_LIMITER_WINDOW = getEnv("AUTH_LIMITER_WINDOW", "15m");
export const AUTH_LIMITER_REQUESTS = parseInt(
	getEnv("AUTH_LIMITER_REQUESTS", "20"),
	10,
);

// Tokens
export const ACCESS_TOKEN_SECRET = getEnv("ACCESS_TOKEN_SECRET");
export const ACCESS_TOKEN_EXPIRES_IN = getEnv("ACCESS_TOKEN_EXPIRES_IN", "30m");

export const REFRESH_TOKEN_SECRET = getEnv("REFRESH_TOKEN_SECRET");
export const REFRESH_TOKEN_EXPIRES_IN = getEnv(
	"REFRESH_TOKEN_EXPIRES_IN",
	"1d",
);

export const CSRF_TOKEN_SECRET = getEnv("CSRF_TOKEN_SECRET");

// Frontend
export const FRONTEND_URL = getEnv("FRONTEND_URL");
