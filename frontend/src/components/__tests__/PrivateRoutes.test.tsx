import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PrivateRoutes } from "../PrivateRoutes";
import * as useAuthModule from "@/hooks/useAuth";
import { Provider } from "@/components/chakraui/provider";

vi.mock("@/hooks/useAuth");

describe("PrivateRoutes", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should display loading spinner when session is restoring", () => {
		vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
			user: undefined,
			token: undefined,
			isSessionRestoring: true,
			setToken: vi.fn(),
			login: vi.fn(),
			logout: vi.fn(),
		});

		render(
			<Provider>
				<MemoryRouter initialEntries={["/dashboard"]}>
					<Routes>
						<Route element={<PrivateRoutes />}>
							<Route
								path="/dashboard"
								element={<div>Protected Content</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
	});

	it("should redirect unauthenticated user to /login", () => {
		vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
			user: undefined,
			token: undefined,
			isSessionRestoring: false,
			setToken: vi.fn(),
			login: vi.fn(),
			logout: vi.fn(),
		});

		render(
			<Provider>
				<MemoryRouter initialEntries={["/dashboard"]}>
					<Routes>
						<Route element={<PrivateRoutes />}>
							<Route
								path="/dashboard"
								element={<div>Protected Content</div>}
							/>
						</Route>
						<Route path="/login" element={<div>Login Page</div>} />
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Login Page")).toBeInTheDocument();
		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
	});

	it("should render protected route content when user is authenticated", () => {
		vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
			user: {
				administratorId: "admin-1",
				firstName: "Jane",
				lastName: "Doe",
				email: "jane@example.com",
				condominiums: [],
			},
			token: "access-token",
			isSessionRestoring: false,
			setToken: vi.fn(),
			login: vi.fn(),
			logout: vi.fn(),
		});

		render(
			<Provider>
				<MemoryRouter initialEntries={["/dashboard"]}>
					<Routes>
						<Route element={<PrivateRoutes />}>
							<Route
								path="/dashboard"
								element={<div>Protected Content</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Protected Content")).toBeInTheDocument();
	});

	it("should render children directly if children prop is passed", () => {
		vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
			user: {
				administratorId: "admin-1",
				firstName: "Jane",
				lastName: "Doe",
				email: "jane@example.com",
				condominiums: [],
			},
			token: "access-token",
			isSessionRestoring: false,
			setToken: vi.fn(),
			login: vi.fn(),
			logout: vi.fn(),
		});

		render(
			<Provider>
				<MemoryRouter initialEntries={["/"]}>
					<PrivateRoutes>
						<div>Direct Child Content</div>
					</PrivateRoutes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Direct Child Content")).toBeInTheDocument();
	});
});
