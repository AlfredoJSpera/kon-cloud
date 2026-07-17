import { Button, For, HStack, VStack } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Toaster, toaster } from "@/components/ui/toaster";

function App() {
	return (
		<VStack>
			<ColorModeButton />
			<Button onClick={() => console.log("Hello")}>
				Click me for a log
			</Button>
			<Toaster />
			<HStack>
				<For each={["success", "error", "warning", "info"]}>
					{(type) => (
						<Button
							size="sm"
							variant="outline"
							key={type}
							onClick={() =>
								toaster.create({
									title: `Toast status is ${type}`,
									type: type,
								})
							}
						>
							{type}
						</Button>
					)}
				</For>
			</HStack>
		</VStack>
	);
}

export default App;
