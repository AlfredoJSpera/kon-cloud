import { Box } from "@chakra-ui/react";
import { Sidebar } from "./Sidebar";

export default function DesktopNavigationSidebar() {
	return (
		<Box
			display={{ base: "none", lg: "block" }}
			w="18rem"
			borderRightWidth="1px"
			px="5"
			py="6"
		>
			<Sidebar />
		</Box>
	);
}
