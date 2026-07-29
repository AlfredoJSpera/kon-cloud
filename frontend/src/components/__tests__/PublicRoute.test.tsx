import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicRoutes } from "../PublicRoute";
import * as useAuthModule from "@/hooks/useAuth";
import { Provider } from "@/components/chakraui/provider";

vi.mock("@/hooks/useAuth");

describe("PublicRoutes", () => {
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
				<MemoryRouter initialEntries={["/login"]}>
					<Routes>
						<Route element={<PublicRoutes />}>
							<Route
								path="/login"
								element={<div>Login Page Content</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(
			screen.queryByText("Login Page Content"),
		).not.toBeInTheDocument();
	});

	it("should redirect authenticated user to /", () => {
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
				<MemoryRouter initialEntries={["/login"]}>
					<Routes>
						<Route element={<PublicRoutes />}>
							<Route
								path="/login"
								element={<div>Login Page Content</div>}
							/>
						</Route>
						<Route path="/" element={<div>Dashboard Page</div>} />
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
		expect(
			screen.queryByText("Login Page Content"),
		).not.toBeInTheDocument();
	});

	it("should render public route content when user is unauthenticated", () => {
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
				<MemoryRouter initialEntries={["/login"]}>
					<Routes>
						<Route element={<PublicRoutes />}>
							<Route
								path="/login"
								element={<div>Login Page Content</div>}
							/>
						</Route>
					</Routes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Login Page Content")).toBeInTheDocument();
	});

	it("should render children directly if children prop is passed", () => {
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
				<MemoryRouter initialEntries={["/login"]}>
					<PublicRoutes>
						<div>Direct Public Child</div>
					</PublicRoutes>
				</MemoryRouter>
			</Provider>,
		);

		expect(screen.getByText("Direct Public Child")).toBeInTheDocument();
	});
});
