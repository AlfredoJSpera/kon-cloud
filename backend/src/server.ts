import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { prisma } from "@lib/prisma";

const app = express();
const port = process.env.SV_PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

// Endpoints
app.get("/administrators", async (req, res) => {
	const administrators = await prisma.administrator.findMany();
	res.json(administrators);
});

app.get("/condominiums", async (req, res) => {
	const condominiums = await prisma.condominium.findMany();
	res.json(condominiums);
});

app.get("/condominiums/:id", async (req, res) => {
	const { id } = req.params;
	const condominiums = await prisma.condominium.findUnique({
		where: { CondominiumID: Number(id) },
	});
	res.json(condominiums);
});

// Run server
app.listen(port, () => {
	console.log(`Express is running on port ${port}`);
});
