import { Button, HStack, Text } from "@chakra-ui/react";
import {
	MenuContent,
	MenuItem,
	MenuRoot,
	MenuTrigger,
} from "@/components/chakraui/menu";
import { useTranslation } from "react-i18next";
import { LuGlobe } from "react-icons/lu";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "it", label: "Italiano" },
];

export function LanguageSelector() {
	const { i18n } = useTranslation();

	// Take primary language code e.g., 'en-US' -> 'en'
	const currentLang = i18n.language?.substring(0, 2).toLowerCase() || "en";

	const handleLanguageChange = (code: string) => {
		i18n.changeLanguage(code);
	};

	return (
		<MenuRoot>
			<MenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					px="2"
					aria-label="Select language"
				>
					<HStack gap="1.5">
						<LuGlobe />
						<Text
							fontSize="xs"
							fontWeight="medium"
							textTransform="uppercase"
						>
							{currentLang}
						</Text>
					</HStack>
				</Button>
			</MenuTrigger>
			<MenuContent minW="140px">
				{LANGUAGES.map((lang) => (
					<MenuItem
						key={lang.code}
						value={lang.code}
						fontWeight={
							currentLang === lang.code ? "bold" : "normal"
						}
						onClick={() => handleLanguageChange(lang.code)}
					>
						{lang.label}
					</MenuItem>
				))}
			</MenuContent>
		</MenuRoot>
	);
}
