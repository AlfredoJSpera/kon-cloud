const url: string | undefined = import.meta.env.VITE_BACKEND_URL;
if (!url) {
	throw new Error("VITE_BACKEND_URL is not defined in .env");
}
export const backendUrl = url.replace(/\/$/, "");

export const loginUrl = backendUrl + "/auth/login";
