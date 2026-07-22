import type { useDisclosure } from "@chakra-ui/react";
import { createContext } from "react";

export interface IDashboardContext {
	drawer: ReturnType<typeof useDisclosure>;
	sidebarBrandName: string;
	sidebarHeading: string;
	topBarTitle: string;
	contentHeaderTitle: string;
	contentHeaderSubtitle: string;
}

export const DashboardContext = createContext<IDashboardContext | null>(null);
