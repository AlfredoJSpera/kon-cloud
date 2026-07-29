import { describe, it, expect, beforeEach, vi } from "vitest";
import Cookies from "js-cookie";
import {
	getRefreshTokenCookie,
	getCsrfTokenCookie,
	clearCsrfTokenCookie,
	clearRefreshTokenCookie,
	areAuthCookiesPresent,
} from "../cookieManagement";

describe("cookieManagement", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe("getRefreshTokenCookie", () => {
		it("should return the refreshToken cookie value if set", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "refreshToken") return "sample-refresh-token";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(getRefreshTokenCookie()).toBe("sample-refresh-token");
		});

		it("should return undefined if refreshToken cookie is not set", () => {
			vi.spyOn(Cookies, "get").mockReturnValue(
				undefined as unknown as { [key: string]: string },
			);
			expect(getRefreshTokenCookie()).toBeUndefined();
		});
	});

	describe("getCsrfTokenCookie", () => {
		it("should return psifi.x-csrf-token if present", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "psifi.x-csrf-token") return "csrf-val-1";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(getCsrfTokenCookie()).toBe("csrf-val-1");
		});

		it("should fallback to __Host-psifi.x-csrf-token if primary is missing", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "__Host-psifi.x-csrf-token") return "csrf-val-2";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(getCsrfTokenCookie()).toBe("csrf-val-2");
		});

		it("should fallback to csrfToken if previous ones are missing", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "csrfToken") return "csrf-val-3";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(getCsrfTokenCookie()).toBe("csrf-val-3");
		});

		it("should fallback to x-csrf-token if all other options are missing", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "x-csrf-token") return "csrf-val-4";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(getCsrfTokenCookie()).toBe("csrf-val-4");
		});

		it("should return undefined if no CSRF cookie is present", () => {
			vi.spyOn(Cookies, "get").mockReturnValue(
				undefined as unknown as { [key: string]: string },
			);
			expect(getCsrfTokenCookie()).toBeUndefined();
		});
	});

	describe("clearCsrfTokenCookie", () => {
		it("should remove all 4 possible CSRF cookies with root path", () => {
			const removeSpy = vi
				.spyOn(Cookies, "remove")
				.mockImplementation(() => {});

			clearCsrfTokenCookie();

			expect(removeSpy).toHaveBeenCalledWith("psifi.x-csrf-token", {
				path: "/",
			});
			expect(removeSpy).toHaveBeenCalledWith(
				"__Host-psifi.x-csrf-token",
				{ path: "/" },
			);
			expect(removeSpy).toHaveBeenCalledWith("csrfToken", { path: "/" });
			expect(removeSpy).toHaveBeenCalledWith("x-csrf-token", {
				path: "/",
			});
		});
	});

	describe("clearRefreshTokenCookie", () => {
		it("should remove refreshToken cookie with root path", () => {
			const removeSpy = vi
				.spyOn(Cookies, "remove")
				.mockImplementation(() => {});

			clearRefreshTokenCookie();

			expect(removeSpy).toHaveBeenCalledWith("refreshToken", {
				path: "/",
			});
		});
	});

	describe("areAuthCookiesPresent", () => {
		it("should return true when both CSRF and Refresh Token cookies exist", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "refreshToken") return "refresh-123";
				if (name === "psifi.x-csrf-token") return "csrf-123";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(areAuthCookiesPresent()).toBe(true);
		});

		it("should return false when refresh token cookie is missing", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "psifi.x-csrf-token") return "csrf-123";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(areAuthCookiesPresent()).toBe(false);
		});

		it("should return false when CSRF token cookie is missing", () => {
			vi.spyOn(Cookies, "get").mockImplementation(((name?: string) => {
				if (name === "refreshToken") return "refresh-123";
				return undefined;
			}) as unknown as typeof Cookies.get);

			expect(areAuthCookiesPresent()).toBe(false);
		});
	});
});
