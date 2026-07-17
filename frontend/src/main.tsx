import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Provider } from "@/components/ui/provider";
import { LoginPage } from "./pages/LoginPage";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="*" element={<Navigate to="/" replace />} />
					{/* <Route path="/" element={<DashboardPage />} />
					
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/settings" element={<SettingsPage />} />
					 */}
				</Routes>
				<Toaster />
			</BrowserRouter>
		</Provider>
	</StrictMode>,
);
