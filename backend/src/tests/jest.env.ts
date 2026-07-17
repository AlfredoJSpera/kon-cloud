process.env.NODE_ENV = "test";

process.env.DB_HOST = process.env.DB_HOST ?? "localhost";
process.env.DB_PORT = process.env.DB_PORT ?? "1433";
process.env.DB_NAME = process.env.DB_NAME ?? "kon_cloud_test";
process.env.DB_USER = process.env.DB_USER ?? "sa";
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? "Password123!";
process.env.DB_ENCRYPT = process.env.DB_ENCRYPT ?? "false";
process.env.DB_TRUST_SERVER_CERTIFICATE =
	process.env.DB_TRUST_SERVER_CERTIFICATE ?? "true";

process.env.SV_PORT = process.env.SV_PORT ?? "3000";
process.env.SV_LOG_LEVEL = process.env.SV_LOG_LEVEL ?? "silent";

process.env.GENERAL_LIMITER_WINDOW =
	process.env.GENERAL_LIMITER_WINDOW ?? "15m";
process.env.GENERAL_LIMITER_REQUESTS =
	process.env.GENERAL_LIMITER_REQUESTS ?? "200";
process.env.GENERAL_LIMITER_HIDE_HEADERS =
	process.env.GENERAL_LIMITER_HIDE_HEADERS ?? "true";
process.env.GENERAL_LIMITER_TRUST_PROXY =
	process.env.GENERAL_LIMITER_TRUST_PROXY ?? "false";

process.env.AUTH_LIMITER_WINDOW = process.env.AUTH_LIMITER_WINDOW ?? "15m";
process.env.AUTH_LIMITER_REQUESTS = process.env.AUTH_LIMITER_REQUESTS ?? "20";

process.env.ACCESS_TOKEN_SECRET =
	process.env.ACCESS_TOKEN_SECRET ?? "test-access-secret";
process.env.ACCESS_TOKEN_EXPIRES_IN =
	process.env.ACCESS_TOKEN_EXPIRES_IN ?? "30m";
process.env.REFRESH_TOKEN_SECRET =
	process.env.REFRESH_TOKEN_SECRET ?? "test-refresh-secret";
process.env.REFRESH_TOKEN_EXPIRES_IN =
	process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1d";
process.env.CSRF_TOKEN_SECRET =
	process.env.CSRF_TOKEN_SECRET ?? "test-csrf-secret";