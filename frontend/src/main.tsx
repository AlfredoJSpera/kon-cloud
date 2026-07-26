import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/chakraui/toaster";
import { Provider } from "@/components/chakraui/provider";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthTestPage } from "./pages/AuthTestPage";
import AuthProvider from "./hooks/AuthProvider";
import { PrivateRoutes } from "./components/PrivateRoutes";
import { PublicRoutes } from "./components/PublicRoute";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route element={<PrivateRoutes />}>
							<Route path="/" element={<DashboardPage />} />
							<Route
								path="/settings"
								element={<SettingsPage />}
							/>
						</Route>
						<Route element={<PublicRoutes />}>
							<Route path="/login" element={<LoginPage />} />
							<Route
								path="/register"
								element={<RegisterPage />}
							/>
						</Route>
						<Route path="/auth-test" element={<AuthTestPage />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
					<Toaster />
				</BrowserRouter>
			</AuthProvider>
		</Provider>
	</StrictMode>,
);
