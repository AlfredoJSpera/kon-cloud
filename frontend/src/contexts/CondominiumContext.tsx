import type {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";
import { createContext } from "react";

export interface ICondominiumContext {
	condominiums: ICondominiumOutput[];
	selectedCondominium: ICondominiumOutput | null;
	loading: boolean;
	isFetched: boolean;
	error: string | null;
	setSelectedCondominium: (condo: ICondominiumOutput | null) => void;
	fetchCondominiums: () => Promise<void>;
	createCondominium: (
		data: ICondominiumCreateInput,
	) => Promise<ICondominiumOutput>;
	updateCondominium: (
		id: number,
		data: ICondominiumUpdateInput,
	) => Promise<ICondominiumOutput>;
	deleteCondominium: (id: number) => Promise<void>;
}

/** Context to access condominium data and operations across the app. */
export const CondominiumContext = createContext<ICondominiumContext | null>(
	null,
);
