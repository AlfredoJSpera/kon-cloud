import "dotenv/config";
import ms, { StringValue } from "ms";
import express from "express";
import cors from "cors";
import authRoutes from "@routes/auth";
import administratorsRoutes from "@routes/administrator";
import { prismaErrorHandler } from "@middleware/errorHandler";
import { loggerHttp, logger } from "@middleware/logger";
import { rateLimit } from "express-rate-limit";

const app = express();
const port = process.env.SV_PORT || 3000;

const rawWindow = process.env.GENERAL_LIMITER_WINDOW || "15m";
const limiterWindowMs = ms(rawWindow as StringValue);

const limiterRequests = parseInt(
	process.env.GENERAL_LIMITER_REQUESTS || "200",
	10,
);

const hideHeaders = parseInt(
	process.env.GENERAL_LIMITER_HIDE_HEADERS || "1",
	10,
);
const standardHeadersOption = hideHeaders === 0 ? "draft-7" : false;

const limiter = rateLimit({
	windowMs: limiterWindowMs,
	limit: limiterRequests,
	// Auth has its own limiter
	skip: (req) => req.path.startsWith("/auth"),
	standardHeaders: standardHeadersOption,
	legacyHeaders: false,
});

const trust_proxy = parseInt(process.env.GENERAL_LIMITER_TRUST_PROXY || "0");
if (trust_proxy) {
	// Trust first proxy for rate limiting
	app.set("trust proxy", 1);
}

// Middleware
app.use(cors());
app.use(loggerHttp);
app.use(limiter);
app.use(express.json());

// Endpoints
app.use("/auth", authRoutes);
app.use("/administrators", administratorsRoutes);

// Automatic error handling
//! Must be directly below the endpoints
app.use(prismaErrorHandler);

// Run server
app.listen(port, () => {
	logger.info(`Express is running on port ${port}`);
});
