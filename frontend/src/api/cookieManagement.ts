import Cookies from "js-cookie";

let memoryCsrfToken: string | undefined = undefined;

export function setMemoryCsrfToken(token: string | undefined): void {
	memoryCsrfToken = token;
}

export function getRefreshTokenCookie(): string | undefined {
	return Cookies.get("refreshToken");
}

export function getCsrfTokenCookie(): string | undefined {
	return (
		memoryCsrfToken ||
		Cookies.get("psifi.x-csrf-token") ||
		Cookies.get("__Host-psifi.x-csrf-token") ||
		Cookies.get("csrfToken") ||
		Cookies.get("x-csrf-token")
	);
}

export function clearCsrfTokenCookie(): void {
	memoryCsrfToken = undefined;
	Cookies.remove("psifi.x-csrf-token", { path: "/" });
	Cookies.remove("__Host-psifi.x-csrf-token", { path: "/" });
	Cookies.remove("csrfToken", { path: "/" });
	Cookies.remove("x-csrf-token", { path: "/" });
}

export function clearRefreshTokenCookie(): void {
	Cookies.remove("refreshToken", { path: "/" });
}

export function areAuthCookiesPresent(): boolean {
	return Boolean(getCsrfTokenCookie() && getRefreshTokenCookie());
}
