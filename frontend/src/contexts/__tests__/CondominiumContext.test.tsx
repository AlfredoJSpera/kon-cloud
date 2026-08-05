/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { CondominiumProvider } from "@/hooks/CondominiumProvider";
import { useCondominium } from "@/hooks/useCondominium";
import { api } from "@/api/api";
import type { ICondominiumOutput } from "@backend-interfaces/condominium";

const mockAuthUser = {
	administratorId: "admin-123",
	firstName: "John",
	lastName: "Doe",
	email: "john@example.com",
};

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => ({
		user: mockAuthUser,
	}),
}));

describe("CondominiumContext & CondominiumProvider", () => {
	const mockCondos: ICondominiumOutput[] = [
		{
			condominiumId: 1,
			administratorId: "admin-123",
			name: "Sun Condos",
			address: "123 Solar St",
		},
		{
			condominiumId: 2,
			administratorId: "admin-123",
			name: "Moon Apartments",
			address: "456 Lunar Way",
		},
	];

	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<CondominiumProvider>{children}</CondominiumProvider>
	);

	it("should fetch condominiums on mount when user is authenticated", async () => {
		vi.spyOn(api, "get").mockResolvedValue({
			data: mockCondos,
		} as any);

		const { result } = renderHook(() => useCondominium(), { wrapper });

		await waitFor(() => {
			expect(result.current.condominiums).toEqual(mockCondos);
		});
	});

	it("should set active selected condominium and persist to localStorage", async () => {
		vi.spyOn(api, "get").mockResolvedValue({
			data: mockCondos,
		} as any);

		const { result } = renderHook(() => useCondominium(), { wrapper });

		await waitFor(() => {
			expect(result.current.condominiums.length).toBe(2);
		});

		act(() => {
			result.current.setSelectedCondominium(mockCondos[1]);
		});

		expect(result.current.selectedCondominium).toEqual(mockCondos[1]);
		expect(localStorage.getItem("selected_condominium_id")).toBe("2");
	});

	it("should create a new condominium and auto-select if none active", async () => {
		vi.spyOn(api, "get").mockResolvedValue({
			data: [],
		} as any);
		const newCondo: ICondominiumOutput = {
			condominiumId: 3,
			administratorId: "admin-123",
			name: "Star Heights",
			address: "789 Cosmos Blvd",
		};
		vi.spyOn(api, "post").mockResolvedValue({
			data: newCondo,
		} as any);

		const { result } = renderHook(() => useCondominium(), { wrapper });

		await waitFor(() => {
			expect(result.current.isFetched).toBe(true);
		});

		let created: ICondominiumOutput | null = null;
		await act(async () => {
			created = await result.current.createCondominium({
				name: "Star Heights",
				address: "789 Cosmos Blvd",
			});
		});

		expect(created).toEqual(newCondo);
		expect(result.current.condominiums).toContainEqual(newCondo);
		expect(result.current.selectedCondominium).toEqual(newCondo);
	});

	it("should update an existing condominium and refresh selectedCondominium state", async () => {
		vi.spyOn(api, "get").mockResolvedValue({
			data: mockCondos,
		} as any);
		const updatedCondo: ICondominiumOutput = {
			condominiumId: 1,
			administratorId: "admin-123",
			name: "Sun Condos Renovated",
			address: "123 Solar St",
		};
		vi.spyOn(api, "put").mockResolvedValue({
			data: updatedCondo,
		} as any);

		const { result } = renderHook(() => useCondominium(), { wrapper });

		await waitFor(() => {
			expect(result.current.condominiums.length).toBe(2);
		});

		act(() => {
			result.current.setSelectedCondominium(mockCondos[0]);
		});

		await act(async () => {
			await result.current.updateCondominium(1, {
				name: "Sun Condos Renovated",
			});
		});

		expect(result.current.selectedCondominium?.name).toBe("Sun Condos Renovated");
		expect(result.current.condominiums[0].name).toBe("Sun Condos Renovated");
	});

	it("should delete a condominium and clear selectedCondominium if deleted", async () => {
		vi.spyOn(api, "get").mockResolvedValue({
			data: mockCondos,
		} as any);
		vi.spyOn(api, "delete").mockResolvedValue({
			data: { message: "Deleted" },
		} as any);

		const { result } = renderHook(() => useCondominium(), { wrapper });

		await waitFor(() => {
			expect(result.current.condominiums.length).toBe(2);
		});

		act(() => {
			result.current.setSelectedCondominium(mockCondos[0]);
		});

		await act(async () => {
			await result.current.deleteCondominium(1);
		});

		expect(result.current.condominiums.length).toBe(1);
		expect(result.current.selectedCondominium).toBeNull();
	});
});
