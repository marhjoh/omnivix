export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

/** Studio + PNG export: banner chrome follows app light/dark (template `themeId` is separate). */
type BannerUiChrome = {
  baseBg: string;
  text: string;
  textMuted: string;
  gridOverlayBg: string;
  gridOverlayBorder: string;
};

export function bannerUiChrome(t: Theme): BannerUiChrome {
  if (t === "light") {
    return {
      baseBg: "#ffffff",
      text: "#1f2328",
      textMuted: "#656d76",
      gridOverlayBg: "rgba(246, 248, 250, 0.94)",
      gridOverlayBorder: "rgba(31, 35, 40, 0.12)",
    };
  }
  return {
    baseBg: "#0d1117",
    text: "rgba(255,255,255,0.92)",
    textMuted: "rgba(255,255,255,0.58)",
    gridOverlayBg: "rgba(13, 17, 23, 0.82)",
    gridOverlayBorder: "rgba(255, 255, 255, 0.1)",
  };
}

/** App chrome only (banner template `themeId` is separate). Cookie name avoids `:` for broad client compatibility. */
export const THEME_COOKIE_NAME = "omnivix-theme";

/** Until the browser's own theme is known (the inline script sets it before first paint). */
export const DEFAULT_THEME: Theme = "dark";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** Single parser: cookie raw value → Theme. Invalid/missing → default. */
export function parseThemeCookie(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME;
}

/** Matches the theme cookie in `document.cookie`; also used, as source, by THEME_INIT_SCRIPT. */
const THEME_COOKIE_PATTERN = `(?:^|; )${THEME_COOKIE_NAME}=(light|dark)(?:;|$)`;

/** Cookie attributes without Secure (added on https, where it's required for SameSite cookies). */
const COOKIE_ATTRIBUTES = `Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;

/**
 * Runs in <head> before first paint: applies the theme cookie, or on a first visit the OS
 * preference (saved to the cookie, which the studio's server render reads).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,m=document.cookie.match(/${THEME_COOKIE_PATTERN}/),t=m?m[1]:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.setAttribute("data-theme",t);if(!m)document.cookie="${THEME_COOKIE_NAME}="+t+"; ${COOKIE_ATTRIBUTES}"+(location.protocol==="https:"?"; Secure":"")}catch(e){}})()`;

/** Client-only: the theme stored in the cookie, or null if none. */
function readThemeCookieClient(): Theme | null {
  const match = document.cookie.match(new RegExp(THEME_COOKIE_PATTERN));
  return match ? (match[1] as Theme) : null;
}

/**
 * Client-only THEME_INIT_SCRIPT, for renders where it didn't run: Strict Mode remounts in
 * development, and error pages after a server error.
 */
export function applyStoredTheme(): void {
  const root = document.documentElement;
  const theme =
    readThemeCookieClient() ??
    (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  if (root.dataset.theme !== theme) root.dataset.theme = theme;
}

/** Client-only: persist for the next full page request / SSR. */
export function setThemeCookieClient(theme: Theme): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; ${COOKIE_ATTRIBUTES}${secure}`;
}
