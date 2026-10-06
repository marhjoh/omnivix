"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  type Theme,
  parseThemeCookie,
  readThemeCookieClient,
  setThemeCookieClient,
} from "@/src/theme/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/*
 * <html data-theme> is the source of truth: the inline script in the root layout sets it before
 * first paint, and CSS (colours, themed logos) follows it directly. React state mirrors it.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getDomTheme(): Theme {
  return parseThemeCookie(document.documentElement.dataset.theme);
}

/**
 * Switches instantly: elements with colour transitions (buttons, pills, sidebar controls) would
 * otherwise animate from the old theme's colours to the new ones, flashing in-between and hover
 * colours. Transitions are disabled for the switch and restored once React has re-rendered.
 */
function applyTheme(theme: Theme) {
  const noTransitions = document.createElement("style");
  noTransitions.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(noTransitions);

  document.documentElement.dataset.theme = theme;
  setThemeCookieClient(theme);

  // Force a style recalculation with transitions off, then restore them after the next frames.
  void window.getComputedStyle(document.body).color;
  requestAnimationFrame(() => requestAnimationFrame(() => noTransitions.remove()));
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const theme = useSyncExternalStore(subscribe, getDomTheme, () => initialTheme);

  // In development, Strict Mode's remount resets <html> to its JSX attributes; restore the stored theme.
  useLayoutEffect(() => {
    const stored = readThemeCookieClient();
    if (stored && stored !== getDomTheme()) document.documentElement.dataset.theme = stored;
  }, []);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);
  const toggle = useCallback(() => applyTheme(getDomTheme() === "dark" ? "light" : "dark"), []);
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
