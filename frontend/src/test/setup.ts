import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Automatically cleanup DOM after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// Mock window.matchMedia for Chakra UI and responsive media queries
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver for UI components
globalThis.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Set default VITE_BACKEND_URL for tests
if (!import.meta.env.VITE_BACKEND_URL) {
	import.meta.env.VITE_BACKEND_URL = "http://localhost:3000";
}
