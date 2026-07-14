import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@lib/prisma";
import { logger } from "@middleware/logger";

export function initTokenCleanupJob() {
	const tokenCleanupCron = process.env.TOKEN_CLEANUP_CRON || "0 0 * * *";

	cron.schedule(
		tokenCleanupCron, // Every day at midnight by default
		async () => {
			logger.info("Starting cleanup of expired Refresh Tokens...");

			try {
				const deleteResult = await prisma.refreshToken.deleteMany({
					where: {
						expiresAt: { lt: new Date() },
					},
				});

				logger.info(
					`Cleanup completed successfully, tokens deleted: ${deleteResult.count}`,
				);
			} catch (error) {
				logger.error(
					{ error },
					"Error while running token cleanup cron job:",
				);
			}
		},
		// {
		// 	name: "tokenCleanUp",
		// 	distributed: true,
		// },
	);
}
