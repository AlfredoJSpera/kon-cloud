import ms, { StringValue } from "ms";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "@routes/auth";
import administratorsRoutes from "@routes/administrator";
import { prismaErrorHandler } from "@middleware/errorHandler";
import { loggerHttp, logger } from "@middleware/logger";
import { rateLimit } from "express-rate-limit";
import {
	GENERAL_LIMITER_HIDE_HEADERS,
	GENERAL_LIMITER_REQUESTS,
	GENERAL_LIMITER_TRUST_PROXY,
	GENERAL_LIMITER_WINDOW,
	SV_PORT,
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
app.use(cors());
app.use(cookieParser());
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
app.listen(SV_PORT, () => {
	logger.info(`Express is running on port ${SV_PORT}`);
});
