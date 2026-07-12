import { prisma } from "@lib/prisma";

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
	console.log("Created administrator:", administrator);

	const allAdministrators = await prisma.administrator.findMany({
		include: { Condominiums: true },
	});

	console.log(
		"All administrators:",
		JSON.stringify(allAdministrators, null, 2),
	);
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
