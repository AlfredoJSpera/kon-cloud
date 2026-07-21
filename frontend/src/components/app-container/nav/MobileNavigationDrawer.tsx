import {
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerRoot,
} from "@/components/ui/drawer";
import { Sidebar } from "./Sidebar";
import { Box } from "@chakra-ui/react";
import { useContext } from "react";
import { AppContext } from "../AppContext";

export function MobileNavigationDrawer() {
	const ctx = useContext(AppContext);
	return (
		<DrawerRoot
			open={ctx?.drawer.open}
			onOpenChange={(details) => ctx?.drawer.setOpen(details.open)}
			placement="bottom"
		>
			<DrawerContent borderRightWidth="1px">
				<DrawerCloseTrigger />
				<DrawerBody>
					<Box mt={8}>
						<Sidebar />
					</Box>
				</DrawerBody>
			</DrawerContent>
		</DrawerRoot>
	);
}
