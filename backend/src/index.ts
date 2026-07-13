import { prisma } from "@lib/prisma";
import { logger } from "./logger";

async function main() {
	const administrator = await prisma.administrator.create({
		data: {
			FirstName: "Mario",
			LastName: "Rossi",
			Email: "mario.rossi@example.com",
			Condominiums: {
				create: {
					Name: "Condominio Primavera",
				},
			},
		},
		include: {
			Condominiums: true,
		},
	});
	logger.info({ administrator }, "Created administrator successfully");

	const allAdministrators = await prisma.administrator.findMany({
		include: { Condominiums: true },
	});

	logger.info({ allAdministrators }, "All administrators");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
