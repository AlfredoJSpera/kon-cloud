import request from "supertest";
import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";

jest.mock("@middleware/loggerMW", () => ({
	logger: {
		info: jest.fn(),
		debug: jest.fn(),
		http: jest.fn(),
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
		condominium: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
		},
		tenant: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
		},
		due: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
		},
		payment: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
			updateMany: jest.fn(),
			aggregate: jest.fn(),
		},
		expense: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			deleteMany: jest.fn(),
			aggregate: jest.fn(),
		},
		$transaction: jest.fn((cbOrArray: unknown) => {
			if (typeof cbOrArray === "function") {
				return (cbOrArray as (tx: unknown) => unknown)(prisma);
			}
			return Promise.all(cbOrArray as Promise<unknown>[]);
		}),
	},
}));

export const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
export const mockPrisma = prisma as unknown as {
	administrator: {
		findUnique: jest.Mock;
		create: jest.Mock;
	};
	condominium: {
		findMany: jest.Mock;
		findUnique: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
		deleteMany: jest.Mock;
	};
	tenant: {
		findMany: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
		deleteMany: jest.Mock;
	};
	due: {
		findMany: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
		deleteMany: jest.Mock;
	};
	payment: {
		findMany: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
		deleteMany: jest.Mock;
		updateMany: jest.Mock;
		aggregate: jest.Mock;
	};
	expense: {
		findMany: jest.Mock;
		findUnique: jest.Mock;
		findFirst: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
		deleteMany: jest.Mock;
		aggregate: jest.Mock;
	};
	$transaction: jest.Mock;
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

	return cookies.find((cookie) =>
		cookie.startsWith("__Host-psifi.x-csrf-token="),
	);
}

export default request;
