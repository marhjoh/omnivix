import { COOKIE_ATTRIBUTES, setCookieClient } from "@/src/lib/cookies";
import { oneOfOr } from "@/src/lib/isOneOf";

export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

/**
 * The app's dark colors for places that can't read the CSS tokens, like the Open Graph images. Keep
 * in sync with `html[data-theme="dark"]` in app/globals.css.
 */
export const DARK_PALETTE = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da8b3",
  accent: "#2f81f7",
} as const;

/** Banner colors that follow the app's light or dark theme. Grid colors are a separate setting. */
export type BannerUiChrome = {
  baseBg: string;
  text: string;
  textMuted: string;
  gridOverlayBg: string;
  gridOverlayBorder: string;
  /** The repos banner's cards. */
  cardBg: string;
  cardBorder: string;
  cardText: string;
  cardTextMuted: string;
  cardShadow: string;
  /** A card's language, star and fork pills. */
  pillBg: string;
};

const LIGHT_TEXT = "#1f2328";
const LIGHT_TEXT_MUTED = "#656d76";

export function bannerUiChrome(t: Theme): BannerUiChrome {
  if (t === "light") {
    return {
      baseBg: "#ffffff",
      text: LIGHT_TEXT,
      textMuted: LIGHT_TEXT_MUTED,
      gridOverlayBg: "rgba(246, 248, 250, 0.94)",
      gridOverlayBorder: "rgba(31, 35, 40, 0.12)",
      cardBg: "rgba(255, 255, 255, 0.94)",
      cardBorder: "rgba(31, 35, 40, 0.12)",
      cardText: LIGHT_TEXT,
      cardTextMuted: LIGHT_TEXT_MUTED,
      cardShadow: "0 8px 24px rgba(31, 35, 40, 0.08)",
      pillBg: "rgba(31, 35, 40, 0.06)",
    };
  }
  return {
    baseBg: DARK_PALETTE.bg,
    text: "rgba(255,255,255,0.92)",
    textMuted: "rgba(255,255,255,0.58)",
    gridOverlayBg: "rgba(13, 17, 23, 0.82)",
    gridOverlayBorder: "rgba(255, 255, 255, 0.1)",
    cardBg: "rgba(21, 28, 40, 0.82)",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    // A little brighter than the banner text, since the cards have their own dark fill.
    cardText: "rgba(255,255,255,0.94)",
    cardTextMuted: "rgba(255,255,255,0.68)",
    cardShadow: "0 10px 26px rgba(2, 6, 23, 0.34)",
    pillBg: "rgba(255, 255, 255, 0.08)",
  };
}

/** For the app's theme, not the banner's grid colors (`themeId`). */
export const THEME_COOKIE_NAME = "omnivix-theme";

/** Used until the inline script has read the cookie or the OS preference. */
export const DEFAULT_THEME: Theme = "dark";

export function parseThemeCookie(value: string | undefined): Theme {
  return oneOfOr(THEMES, value, DEFAULT_THEME);
}

/** Matches the theme cookie in `document.cookie`. THEME_INIT_SCRIPT inlines it as well. */
const THEME_COOKIE_PATTERN = `(?:^|; )${THEME_COOKIE_NAME}=(light|dark)(?:;|$)`;

/**
 * Runs in <head> before first paint. It applies the theme cookie, or the OS preference on a first
 * visit. It saves that preference to the cookie, because the studio's server render reads it.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement,m=document.cookie.match(/${THEME_COOKIE_PATTERN}/),t=m?m[1]:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.setAttribute("data-theme",t);if(!m)document.cookie="${THEME_COOKIE_NAME}="+t+"; ${COOKIE_ATTRIBUTES}"+(location.protocol==="https:"?"; Secure":"")}catch(e){}})()`;

/**
 * THEME_INIT_SCRIPT for renders where it didn't run: Strict Mode remounts in development, and
 * pages rendered in the browser, like a studio 404 (Next sends an empty error shell) and
 * global-error.tsx. Like the script, it saves the OS preference on a first visit so the next
 * studio request renders in the same theme.
 */
export function applyStoredTheme(): void {
  const root = document.documentElement;
  const stored = document.cookie.match(new RegExp(THEME_COOKIE_PATTERN))?.[1] as Theme | undefined;
  const theme = stored ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  if (!stored) setThemeCookieClient(theme);
  if (root.dataset.theme !== theme) root.dataset.theme = theme;
}

export function setThemeCookieClient(theme: Theme): void {
  setCookieClient(THEME_COOKIE_NAME, theme);
}
