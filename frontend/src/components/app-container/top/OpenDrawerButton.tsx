import { IconButton } from "@chakra-ui/react";
import { LuMenu } from "react-icons/lu";

export default function OpenDrawerButton(props: { drawerOnOpen: () => void }) {
	return (
		<IconButton
			aria-label="Open navigation"
			size="sm"
			variant="ghost"
			display={{ base: "inline-flex", lg: "none" }}
			onClick={props.drawerOnOpen}
		>
			<LuMenu />
		</IconButton>
	);
}
