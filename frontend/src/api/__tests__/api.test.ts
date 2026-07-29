import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, makeApiRequest } from "../api";

describe("api and makeApiRequest", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should create Axios instance with correct defaults", () => {
		expect(api.defaults.withCredentials).toBe(true);
		expect(api.defaults.baseURL).toBe("http://localhost:3000");
	});

	describe("makeApiRequest.administrators", () => {
		it("should make GET request to /administrators/me", async () => {
			const getSpy = vi
				.spyOn(api, "get")
				.mockResolvedValue({ data: { administratorId: "admin-1" } });

			const response = await makeApiRequest.administrators.me();

			expect(getSpy).toHaveBeenCalledWith(
				"/administrators/me",
				undefined,
			);
			expect(response.data).toEqual({ administratorId: "admin-1" });
		});

		it("should make POST request to /administrators/register", async () => {
			const postSpy = vi
				.spyOn(api, "post")
				.mockResolvedValue({ data: { success: true } });
			const regInput = {
				firstName: "Jane",
				lastName: "Doe",
				email: "jane.doe@example.com",
				password: "Password123!",
			};

			const response =
				await makeApiRequest.administrators.register(regInput);

			expect(postSpy).toHaveBeenCalledWith(
				"/administrators/register",
				regInput,
				undefined,
			);
			expect(response.data).toEqual({ success: true });
		});
	});

	describe("makeApiRequest.auth", () => {
		it("should make POST request to /auth/login", async () => {
			const postSpy = vi.spyOn(api, "post").mockResolvedValue({
				data: {
					accessToken: "test-token",
					profile: { email: "test@example.com" },
				},
			});
			const credentials = {
				email: "test@example.com",
				password: "Password123!",
			};

			const response = await makeApiRequest.auth.login(credentials);

			expect(postSpy).toHaveBeenCalledWith(
				"/auth/login",
				credentials,
				undefined,
			);
			expect(response.data.accessToken).toBe("test-token");
		});

		it("should make POST request to /auth/logout", async () => {
			const postSpy = vi
				.spyOn(api, "post")
				.mockResolvedValue({ data: {} });

			await makeApiRequest.auth.logout();

			expect(postSpy).toHaveBeenCalledWith("/auth/logout", undefined);
		});

		it("should make GET request to /auth/refresh-token", async () => {
			const getSpy = vi.spyOn(api, "get").mockResolvedValue({
				data: { accessToken: "new-access-token" },
			});

			const response = await makeApiRequest.auth.refreshToken();

			expect(getSpy).toHaveBeenCalledWith(
				"/auth/refresh-token",
				undefined,
			);
			expect(response.data.accessToken).toBe("new-access-token");
		});
	});
});
