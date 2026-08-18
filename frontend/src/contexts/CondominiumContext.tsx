import type {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";
import { createContext } from "react";

export interface ICondominiumContext {
	/** The list of condominiums owned by the logged in user. */
	condominiums: ICondominiumOutput[];
	/** The currently selected condominium from the list. */
	selectedCondominium: ICondominiumOutput | null;
	/** Flag that indicates that the condominium list fetching is in progress. */
	loading: boolean;
	/** Flag that indicates that the condominium list fetching is completed. */
	isFetched: boolean;
	/** Indicates errors during condominium list fetching. */
	error: string | null;
	/** Sets the currently selected condominium and saves its ID in the localStorage. */
	setSelectedCondominium: (condo: ICondominiumOutput | null) => void;
	/** Fetches the user's condominium list from the database. */
	fetchCondominiums: () => Promise<void>;
	/** Creates a new condominium in the database and appends it in the condominium list. */
	createCondominium: (
		data: ICondominiumCreateInput,
	) => Promise<ICondominiumOutput>;
	/** Updates an existing condominium in the database and in the condominium list. */
	updateCondominium: (
		id: number,
		data: ICondominiumUpdateInput,
	) => Promise<ICondominiumOutput>;
	/** Deletes an existing condominium in the database and from the condominium list. */
	deleteCondominium: (id: number) => Promise<void>;
}

/** Context to access condominium data and operations across the app. */
export const CondominiumContext = createContext<ICondominiumContext | null>(
	null,
);
