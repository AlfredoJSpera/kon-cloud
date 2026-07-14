import cron from "node-cron";
import { prisma } from "@lib/prisma";
import { logger } from "@middleware/logger";

export function initTokenCleanupJob() {
	cron.schedule(
		"0 0 * * *", // Every day at midnight
		async () => {
			logger.info("Starting cleanup of expired Refresh Tokens...");

			try {
				const deleteResult = await prisma.refreshToken.deleteMany({
					where: {
						expiresAt: { lt: new Date() },
					},
				});

				logger.info(
					`Cleanup completed successfully. Tokens deleted: ${deleteResult.count}.`,
				);
			} catch (error) {
				logger.error(
					{ error },
					"Error while running token cleanup cron job.",
				);
			}
		},
		// {
		// 	name: "tokenCleanUp",
		// 	distributed: true,
		// },
	);
}
