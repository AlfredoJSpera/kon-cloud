import { useContext } from "react";
import { AuthContext, type IAuthContext } from "@/contexts/AuthContext";

/**
 * Custom hook to access authentication context.
 * Must be used within an `AuthProvider`.
 */
export function useAuth(): IAuthContext {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
