import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "../useAuth";
import { AuthContext } from "@/contexts/AuthContext";
import React from "react";

describe("useAuth", () => {
	it("should throw an error when used outside of AuthProvider", () => {
		// Silence console.error for expected thrown error
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => renderHook(() => useAuth())).toThrow(
			"useAuth must be used within an AuthProvider",
		);

		consoleSpy.mockRestore();
	});

	it("should return auth context value when used within AuthContext Provider", () => {
		const mockContextValue = {
			token: "mock-token",
			setToken: vi.fn(),
			user: {
				administratorId: "admin-1",
				firstName: "John",
				lastName: "Doe",
				email: "john@example.com",
				condominiums: [],
			},
			isSessionRestoring: false,
			login: vi.fn(),
			logout: vi.fn(),
		};

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				AuthContext.Provider,
				{ value: mockContextValue },
				children,
			);

		const { result } = renderHook(() => useAuth(), { wrapper });

		expect(result.current.token).toBe("mock-token");
		expect(result.current.user?.email).toBe("john@example.com");
		expect(result.current.isSessionRestoring).toBe(false);
	});
});
