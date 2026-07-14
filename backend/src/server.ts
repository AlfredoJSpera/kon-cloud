import "dotenv/config";
import express from "express";
import cors from "cors";
import { prismaErrorHandler } from "@middleware/errorHandler";
import { loggerHttp, logger } from "@middleware/logger";
import { rateLimit } from "express-rate-limit";
import authRoutes from "@routes/authRoutes";
import administratorsRoutes from "@routes/administratorsRoutes";

const app = express();
const port = process.env.SV_PORT || 3000;
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 500,
	standardHeaders: false,
	legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(loggerHttp);
app.use(express.json());
app.use(limiter);

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
