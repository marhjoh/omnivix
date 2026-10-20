"use client";

import { THEME_INIT_SCRIPT } from "@/src/theme/theme";

/**
 * THEME_INIT_SCRIPT in <head>. It runs as the server's HTML is parsed. When React renders it in the
 * browser (the error pages after a server error) it's text/plain: React warns about script tags
 * it creates, which wouldn't run anyway; applyStoredTheme covers that case.
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
