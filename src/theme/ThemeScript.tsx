"use client";

import { THEME_INIT_SCRIPT } from "@/src/theme/theme";

/**
 * Puts THEME_INIT_SCRIPT in <head>. In the browser it renders as text/plain, because the script
 * wouldn't run there and React warns about script tags. applyStoredTheme covers that case.
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
