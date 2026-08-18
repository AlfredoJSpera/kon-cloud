import { useContext } from "react";
import { CondominiumContext } from "@/contexts/CondominiumContext";

export function useCondominium() {
	const context = useContext(CondominiumContext);
	if (!context) {
		throw new Error(
			"useCondominium must be used within a CondominiumProvider",
		);
	}
	return context;
}
