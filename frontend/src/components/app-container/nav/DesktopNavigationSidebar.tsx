import { Box } from "@chakra-ui/react";
import { Sidebar } from "./Sidebar";

export default function DesktopNavigationSidebar(props: {
	brandName: string;
	heading: string;
	navigate: (path: string) => void;
}) {
	return (
		<Box
			display={{ base: "none", lg: "block" }}
			w="18rem"
			borderRightWidth="1px"
			px="5"
			py="6"
		>
			<Sidebar
				brandName={props.brandName}
				heading={props.heading}
				navigate={props.navigate}
			/>
		</Box>
	);
}
