import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CondominiumContext } from "@/contexts/CondominiumContext";
import { makeApiRequest } from "@/api/api";
import type {
	ICondominiumCreateInput,
	ICondominiumOutput,
	ICondominiumUpdateInput,
} from "@backend-interfaces/condominium";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "selected_condominium_id";

export function CondominiumProvider(props: { children: ReactNode }) {
	const { user } = useAuth();
	const [condominiums, setCondominiums] = useState<ICondominiumOutput[]>([]);
	const [selectedCondominium, setSelectedCondominiumState] =
		useState<ICondominiumOutput | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [isFetched, setIsFetched] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

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
			setCondominiums([]);
			setSelectedCondominiumState(null);
			setIsFetched(true);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const res = await makeApiRequest.condominiums.list();
			const list = res.data;
			setCondominiums(list);

			const savedId = localStorage.getItem(STORAGE_KEY);
			if (savedId && list.length > 0) {
				const found = list.find(
					(c) => String(c.condominiumId) === savedId,
				);
				if (found) {
					setSelectedCondominiumState(found);
				} else {
					setSelectedCondominiumState(list[0]);
					localStorage.setItem(
						STORAGE_KEY,
						String(list[0].condominiumId),
					);
				}
			}
		} catch (err: unknown) {
			setError("Failed to fetch condominiums");
		} finally {
			setLoading(false);
			setIsFetched(true);
		}
	}, [user]);

	useEffect(() => {
		if (user) {
			fetchCondominiums();
		} else {
			setCondominiums([]);
			setSelectedCondominiumState(null);
			setIsFetched(true);
		}
	}, [user, fetchCondominiums]);

	const createCondominium = async (
		data: ICondominiumCreateInput,
	): Promise<ICondominiumOutput> => {
		const res = await makeApiRequest.condominiums.create(data);
		const created = res.data;
		setCondominiums((prev) => [...prev, created]);
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
		setCondominiums((prev) =>
			prev.map((item) => (item.condominiumId === id ? updated : item)),
		);
		setSelectedCondominiumState((prevSelected) =>
			prevSelected?.condominiumId === id ? updated : prevSelected,
		);
		return updated;
	};

	const deleteCondominium = async (id: number): Promise<void> => {
		await makeApiRequest.condominiums.delete(id);
		setCondominiums((prev) =>
			prev.filter((item) => item.condominiumId !== id),
		);
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
