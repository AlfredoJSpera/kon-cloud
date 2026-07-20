import ms, { StringValue } from "ms";
import express from "express";
import cors from "cors";
import authRoutes from "@routes/auth";
import administratorsRoutes from "@routes/administrator";
import { prismaErrorHandler } from "@middleware/errorHandler";
import { loggerHttp } from "@middleware/logger";
import { rateLimit } from "express-rate-limit";
import {
	FRONTEND_URL,
	GENERAL_LIMITER_HIDE_HEADERS,
	GENERAL_LIMITER_REQUESTS,
	GENERAL_LIMITER_TRUST_PROXY,
	GENERAL_LIMITER_WINDOW,
} from "@utils/envVariables";

const app = express();

const limiter = rateLimit({
	windowMs: ms(GENERAL_LIMITER_WINDOW as StringValue),
	limit: GENERAL_LIMITER_REQUESTS,
	skip: (req) => req.path.startsWith("/auth"), // Auth has its own limiter
	standardHeaders: GENERAL_LIMITER_HIDE_HEADERS,
	legacyHeaders: false,
});

if (GENERAL_LIMITER_TRUST_PROXY) {
	// Trust first proxy for rate limiting
	app.set("trust proxy", 1);
}

// Middleware
app.use(
	cors({
		origin: FRONTEND_URL,
		credentials: true,
	}),
);
app.use(loggerHttp);
app.use(limiter);
app.use(express.json());

// Endpoints
app.use("/auth", authRoutes);
app.use("/administrators", administratorsRoutes);

// Automatic error handling
//! Must be directly below the endpoints
app.use(prismaErrorHandler);

export default app;
