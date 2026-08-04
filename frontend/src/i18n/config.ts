import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const resources = {
	en: {
		translation: {
			topbar: {
				profile: "Profile",
				settings: "Settings",
				logout: "Logout",
				darkMode: "Dark mode",
				lightMode: "Light mode",
				language: "Language",
				administrator: "Administrator",
			},
			sidebar: {
				pageLayout: "Page Layout",
			},
			languages: {
				en: "English",
				it: "Italiano",
			},
			dashboard: {
				welcome: "Welcome back, {{name}}",
				pageLayout: "Page Layout",
				overviewSettings: "Overview Settings",
				openDashboard: "Open dashboard",
			},
		},
	},
	it: {
		translation: {
			topbar: {
				profile: "Profilo",
				settings: "Impostazioni",
				logout: "Disconnettiti",
				darkMode: "Modalità scura",
				lightMode: "Modalità chiara",
				language: "Lingua",
				administrator: "Amministratore",
			},
			languages: {
				en: "English",
				it: "Italiano",
			},
			dashboard: {
				welcome: "Bentornato, {{name}}",
				pageLayout: "Layout della pagina",
				overviewSettings: "Impostazioni generali",
				openDashboard: "Apri dashboard",
			},
		},
	} as const,
};

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
