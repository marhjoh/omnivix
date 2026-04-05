export type Theme = "light" | "dark";

/** Studio + PNG export: banner chrome follows app light/dark (template `themeId` is separate). */
export type BannerUiChrome = {
  baseBg: string;
  text: string;
  textMuted: string;
  gridOverlayBg: string;
  gridOverlayBorder: string;
  frameFallback: string;
  frameBorder: string;
  emptyStateIconSrc: string;
};

export function bannerUiChrome(t: Theme): BannerUiChrome {
  if (t === "light") {
    return {
      baseBg: "#ffffff",
      text: "#1f2328",
      textMuted: "#656d76",
      gridOverlayBg: "rgba(246, 248, 250, 0.94)",
      gridOverlayBorder: "rgba(31, 35, 40, 0.12)",
      frameFallback: "#ffffff",
      frameBorder: "rgba(31, 35, 40, 0.12)",
      emptyStateIconSrc: "/brand/icon-dark.svg",
    };
  }
  return {
    baseBg: "#0d1117",
    text: "rgba(255,255,255,0.92)",
    textMuted: "rgba(255,255,255,0.58)",
    gridOverlayBg: "rgba(13, 17, 23, 0.82)",
    gridOverlayBorder: "rgba(255, 255, 255, 0.1)",
    frameFallback: "#0f172a",
    frameBorder: "rgba(255,255,255,0.12)",
    emptyStateIconSrc: "/brand/icon-light.svg",
  };
}

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
