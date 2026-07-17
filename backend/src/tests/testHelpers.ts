import request from "supertest";

jest.mock("@middleware/logger", () => ({
	logger: {
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
	},
	loggerHttp: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock(
	"cors",
	() => () => (_req: unknown, _res: unknown, next: () => void) => next(),
);

jest.mock("express-rate-limit", () => ({
	rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("bcrypt", () => ({
	__esModule: true,
	default: {
		hash: jest.fn(),
		compare: jest.fn(),
	},
	hash: jest.fn(),
	compare: jest.fn(),
}));

jest.mock("@lib/prisma", () => ({
	prisma: {
		administrator: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	},
}));

import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";

export const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
export const mockPrisma = prisma as unknown as {
	administrator: {
		findUnique: jest.Mock;
		create: jest.Mock;
	};
};

export const adminRecord = {
	AdministratorID: "admin-123",
	FirstName: "Ada",
	LastName: "Lovelace",
	Email: "ada@example.com",
	PasswordHash: "hashed-password",
	Condominiums: [
		{
			CondominiumID: 1,
			Name: "North Tower",
		},
	],
};

export function getCsrfCookie(setCookieHeader: string | string[] | undefined) {
	const cookies = Array.isArray(setCookieHeader)
		? setCookieHeader
		: setCookieHeader
			? [setCookieHeader]
			: [];

	return cookies.find((cookie) => cookie.startsWith("__Host-psifi.x-csrf-token="));
}

export default request;