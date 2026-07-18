import {
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerRoot,
} from "@/components/ui/drawer";
import { Sidebar } from "./Sidebar";
import { Box } from "@chakra-ui/react";

export function MobileNavigationDrawer(props: {
	brandName: string;
	heading: string;
	drawerOpen: boolean;
	drawerSetOpen: (open: boolean) => void;
	navigate: (path: string) => void;
}) {
	return (
		<DrawerRoot
			open={props.drawerOpen}
			onOpenChange={(details) => props.drawerSetOpen(details.open)}
			placement="bottom"
		>
			<DrawerContent borderRightWidth="1px">
				<DrawerCloseTrigger />
				<DrawerBody>
					<Box mt={8}>
						<Sidebar
							brandName={props.brandName}
							heading={props.heading}
							navigate={props.navigate}
						/>
					</Box>
				</DrawerBody>
			</DrawerContent>
		</DrawerRoot>
	);
}
