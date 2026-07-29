/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import AuthProvider from "../AuthProvider";
import { useAuth } from "../useAuth";
import { makeApiRequest } from "@/api/api";
import { toaster } from "@/components/chakraui/toaster";
import * as cookieManagement from "@/api/cookieManagement";

// Mock Chakra UI toaster
vi.mock("@/components/chakraui/toaster", () => ({
	toaster: {
		create: vi.fn(),
	},
}));

describe("AuthProvider", () => {
	const mockUser = {
		administratorId: "admin-123",
		firstName: "Alice",
		lastName: "Smith",
		email: "alice@example.com",
		condominiums: [],
	};

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<AuthProvider>{children}</AuthProvider>
	);

	it("should attempt session restoration on mount and handle failure gracefully", async () => {
		vi.spyOn(makeApiRequest.auth, "refreshToken").mockRejectedValue(
			new Error("No active session"),
		);

		const { result } = renderHook(() => useAuth(), { wrapper });

		expect(result.current.isSessionRestoring).toBe(true);

		await waitFor(() => {
			expect(result.current.isSessionRestoring).toBe(false);
		});

		expect(result.current.token).toBeUndefined();
		expect(result.current.user).toBeUndefined();
	});

	it("should restore session successfully when valid refresh token exists", async () => {
		vi.spyOn(makeApiRequest.auth, "refreshToken").mockResolvedValue({
			data: { accessToken: "valid-access-token" },
		} as any);

		vi.spyOn(makeApiRequest.administrators, "me").mockResolvedValue({
			data: mockUser,
		} as any);

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSessionRestoring).toBe(false);
		});

		expect(result.current.token).toBe("valid-access-token");
		expect(result.current.user).toEqual(mockUser);
	});

	it("should login successfully and set token and user state", async () => {
		vi.spyOn(makeApiRequest.auth, "refreshToken").mockRejectedValue(
			new Error("No session"),
		);
		vi.spyOn(makeApiRequest.auth, "login").mockResolvedValue({
			data: {
				accessToken: "login-token",
				profile: mockUser,
			},
		} as any);

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSessionRestoring).toBe(false);
		});

		await act(async () => {
			await result.current.login({
				email: "alice@example.com",
				password: "Password123!",
			});
		});

		expect(result.current.token).toBe("login-token");
		expect(result.current.user).toEqual(mockUser);
	});

	it("should handle login errors and trigger error toast", async () => {
		vi.spyOn(makeApiRequest.auth, "refreshToken").mockRejectedValue(
			new Error("No session"),
		);

		const axiosError = {
			isAxiosError: true,
			response: {
				data: { errorCode: "INVALID_CREDENTIALS" },
			},
		};
		vi.spyOn(makeApiRequest.auth, "login").mockRejectedValue(axiosError);

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSessionRestoring).toBe(false);
		});

		await expect(
			act(async () => {
				await result.current.login({
					email: "wrong@example.com",
					password: "bad",
				});
			}),
		).rejects.toBeDefined();

		expect(toaster.create).toHaveBeenCalledWith({
			title: "Login failed",
			description: "The email or password you entered are incorrect.",
			type: "error",
		});
	});

	it("should logout successfully, clear cookies and reset state", async () => {
		vi.spyOn(makeApiRequest.auth, "refreshToken").mockResolvedValue({
			data: { accessToken: "valid-token" },
		} as any);
		vi.spyOn(makeApiRequest.administrators, "me").mockResolvedValue({
			data: mockUser,
		} as any);
		vi.spyOn(makeApiRequest.auth, "logout").mockResolvedValue({
			data: {},
		} as any);

		const clearCsrfSpy = vi.spyOn(cookieManagement, "clearCsrfTokenCookie");
		const clearRefreshSpy = vi.spyOn(
			cookieManagement,
			"clearRefreshTokenCookie",
		);

		const { result } = renderHook(() => useAuth(), { wrapper });

		await waitFor(() => {
			expect(result.current.token).toBe("valid-token");
		});

		await act(async () => {
			await result.current.logout();
		});

		expect(clearCsrfSpy).toHaveBeenCalled();
		expect(clearRefreshSpy).toHaveBeenCalled();
		expect(result.current.token).toBeUndefined();
		expect(result.current.user).toBeUndefined();
	});
});
