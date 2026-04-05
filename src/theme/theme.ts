export type Theme = "light" | "dark";

/** App chrome only (banner template `themeId` is separate). Cookie name avoids `:` for broad client compatibility. */
export const THEME_COOKIE_NAME = "omnivix-theme";

export const DEFAULT_THEME: Theme = "dark";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** Single parser: cookie raw value → Theme. Invalid/missing → default. */
export function parseThemeCookie(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

/** Client-only: persist for the next full page request / SSR. */
export function setThemeCookieClient(theme: Theme): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const tail = secure
    ? `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax; Secure`
    : `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; ${tail}`;
}
