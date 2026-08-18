import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CondominiumContext } from "@/contexts/CondominiumContext";
import { makeApiRequest } from "@/api/api";
import type {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "selected_condominium_id";

export function CondominiumProvider(props: { children: ReactNode }) {
	const { user } = useAuth();
	const { t } = useTranslation();
	const [condominiums, setCondominiums] = useState<ICondominiumOutput[]>([]);
	const [selectedCondominium, setSelectedCondominiumState] =
		useState<ICondominiumOutput | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [isFetched, setIsFetched] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Callback different from the state setter to be used outside
	// for automatic localStorage management alongside state management
	const setSelectedCondominium = useCallback(
		(condo: ICondominiumOutput | null) => {
			setSelectedCondominiumState(condo);
			if (condo) {
				localStorage.setItem(STORAGE_KEY, String(condo.condominiumId));
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		},
		[],
	);

	const fetchCondominiums = useCallback(async () => {
		if (!user) {
			// User is not logged in
			setCondominiums([]);
			setSelectedCondominiumState(null);
			setIsFetched(true);
			return;
		}

		// User is logged in
		setLoading(true);
		setError(null);
		try {
			// Fetch user's condominiums
			const res = await makeApiRequest.condominiums.list();
			const list = res.data;
			setCondominiums(list);

			// Find the localStorage condominium ID in the list and select it
			const savedId = localStorage.getItem(STORAGE_KEY);
			if (savedId && list.length > 0) {
				const found = list.find(
					(c) => String(c.condominiumId) === savedId,
				);

				if (found) {
					setSelectedCondominiumState(found);
				} else {
					// If the saved condominium was deleted or wrong, select the first
					setSelectedCondominiumState(list[0]);
					localStorage.setItem(
						STORAGE_KEY,
						String(list[0].condominiumId),
					);
				}
			}
		} catch (err: unknown) {
			setError(t("condominiums.fetchError"));
		} finally {
			setLoading(false);
			setIsFetched(true);
		}
	}, [user, t]);

	// Runs the fetch on page load
	useEffect(() => {
		let isMounted = true;
		Promise.resolve().then(() => {
			if (isMounted) {
				fetchCondominiums();
			}
		});
		return () => {
			isMounted = false;
		};
	}, [fetchCondominiums]);

	const createCondominium = async (
		data: ICondominiumCreateInput,
	): Promise<ICondominiumOutput> => {
		const res = await makeApiRequest.condominiums.create(data);
		const created = res.data;
		// Append the created condominium to the list
		setCondominiums((prev) => [...prev, created]);
		// Select it if none was selected
		setSelectedCondominiumState((prevSelected) =>
			prevSelected === null ? created : prevSelected,
		);
		return created;
	};

	const updateCondominium = async (
		id: number,
		data: ICondominiumUpdateInput,
	): Promise<ICondominiumOutput> => {
		const res = await makeApiRequest.condominiums.update(id, data);
		const updated = res.data;
		// Replace the updated condominium in the list
		setCondominiums((prev) =>
			prev.map((item) => (item.condominiumId === id ? updated : item)),
		);
		// Select it if none was selected
		setSelectedCondominiumState((prevSelected) =>
			prevSelected?.condominiumId === id ? updated : prevSelected,
		);
		return updated;
	};

	const deleteCondominium = async (id: number): Promise<void> => {
		await makeApiRequest.condominiums.delete(id);
		// Delete the condominium from the list
		setCondominiums((prev) =>
			prev.filter((item) => item.condominiumId !== id),
		);
		// Unselect it
		setSelectedCondominiumState((prevSelected) =>
			prevSelected?.condominiumId === id ? null : prevSelected,
		);
	};

	return (
		<CondominiumContext.Provider
			value={{
				condominiums,
				selectedCondominium,
				loading,
				isFetched,
				error,
				setSelectedCondominium,
				fetchCondominiums,
				createCondominium,
				updateCondominium,
				deleteCondominium,
			}}
		>
			{props.children}
		</CondominiumContext.Provider>
	);
}
