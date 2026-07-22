import type { useDisclosure } from "@chakra-ui/react";
import { createContext } from "react";

export interface IAppContext {
	drawer: ReturnType<typeof useDisclosure>;
	sidebarBrandName: string;
	sidebarHeading: string;
	topBarTitle: string;
	contentHeaderTitle: string;
	contentHeaderSubtitle: string;
}

export const AppContext = createContext<IAppContext | null>(null);
