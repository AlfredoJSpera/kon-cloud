import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, makeApiRequest } from "../api";
import type {
	ICondominiumOutput,
	ICondominiumCreateInput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";

describe("makeApiRequest.condominiums", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should make GET request to /condominiums for list", async () => {
		const mockCondos: ICondominiumOutput[] = [
			{
				condominiumId: 1,
				administratorId: "admin-1",
				name: "Sunrise Park",
				address: "123 Main St",
			},
		];
		const getSpy = vi
			.spyOn(api, "get")
			.mockResolvedValue({ data: mockCondos });

		const res = await makeApiRequest.condominiums.list();

		expect(getSpy).toHaveBeenCalledWith("/condominiums", undefined);
		expect(res.data).toEqual(mockCondos);
	});

	it("should make GET request to /condominiums/:id", async () => {
		const mockCondo: ICondominiumOutput = {
			condominiumId: 5,
			administratorId: "admin-1",
			name: "Ocean View",
			address: "456 Beach Rd",
		};
		const getSpy = vi
			.spyOn(api, "get")
			.mockResolvedValue({ data: mockCondo });

		const res = await makeApiRequest.condominiums.getById(5);

		expect(getSpy).toHaveBeenCalledWith("/condominiums/5", undefined);
		expect(res.data).toEqual(mockCondo);
	});

	it("should make POST request to /condominiums for create", async () => {
		const input: ICondominiumCreateInput = {
			name: "Green Valley",
			address: "789 Park Ave",
		};
		const created: ICondominiumOutput = {
			condominiumId: 10,
			administratorId: "admin-1",
			...input,
		};
		const postSpy = vi
			.spyOn(api, "post")
			.mockResolvedValue({ data: created });

		const res = await makeApiRequest.condominiums.create(input);

		expect(postSpy).toHaveBeenCalledWith("/condominiums", input, undefined);
		expect(res.data).toEqual(created);
	});

	it("should make PUT request to /condominiums/:id for update", async () => {
		const updateData: ICondominiumUpdateInput = {
			name: "Green Valley Updated",
		};
		const updated: ICondominiumOutput = {
			condominiumId: 10,
			administratorId: "admin-1",
			name: "Green Valley Updated",
			address: "789 Park Ave",
		};
		const putSpy = vi
			.spyOn(api, "put")
			.mockResolvedValue({ data: updated });

		const res = await makeApiRequest.condominiums.update(10, updateData);

		expect(putSpy).toHaveBeenCalledWith(
			"/condominiums/10",
			updateData,
			undefined,
		);
		expect(res.data).toEqual(updated);
	});

	it("should make DELETE request to /condominiums/:id for delete", async () => {
		const deleteSpy = vi
			.spyOn(api, "delete")
			.mockResolvedValue({ data: { message: "Deleted" } });

		const res = await makeApiRequest.condominiums.delete(10);

		expect(deleteSpy).toHaveBeenCalledWith("/condominiums/10", undefined);
		expect(res.data).toEqual({ message: "Deleted" });
	});
});
