module.exports = {
	testEnvironment: "node",
	clearMocks: true,
	setupFiles: ["<rootDir>/src/tests/jest.env.ts"],
	testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
	moduleNameMapper: {
		"^@generated/(.*)$": "<rootDir>/generated/$1",
		"^@interfaces/(.*)$": "<rootDir>/interfaces/$1",
		"^@errors/(.*)$": "<rootDir>/src/errors/$1",
		"^@lib/(.*)$": "<rootDir>/src/lib/$1",
		"^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
		"^@routes/(.*)$": "<rootDir>/src/routes/$1",
		"^@utils/(.*)$": "<rootDir>/src/utils/$1",
	},
	transform: {
		"^.+\\.tsx?$": [
			"@swc/jest",
			{
				jsc: {
					target: "es2022",
					parser: {
						syntax: "typescript",
						tsx: false,
					},
				},
				module: {
					type: "commonjs",
				},
			},
		],
	},
};