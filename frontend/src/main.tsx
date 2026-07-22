import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/chakraui/toaster";
import { Provider } from "@/components/chakraui/provider";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import AuthProvider from "./providers/AuthProvider";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/login" element={<LoginPage />} />
						<Route path="/register" element={<RegisterPage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
					<Toaster />
				</BrowserRouter>
			</AuthProvider>
		</Provider>
	</StrictMode>,
);
