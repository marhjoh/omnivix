"use client";

import { THEME_INIT_SCRIPT } from "@/src/theme/theme";

/**
 * THEME_INIT_SCRIPT for <head>. Rendered as text/plain in the browser, where it wouldn't run and
 * React warns about script tags; applyStoredTheme covers that case.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
