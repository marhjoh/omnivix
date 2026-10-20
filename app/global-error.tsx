"use client";

import { useLayoutEffect } from "react";
import { SITE_NAME } from "@/src/lib/site";
import { applyStoredTheme } from "@/src/theme/theme";
import { RuntimeError } from "@/src/error-pages/RuntimeError";
import { inter } from "./fonts";
import "./globals.css";

/**
 * Errors in the root layout. Replaces it, so it brings its own document, styles and font.
 * No header: the theme toggle needs ThemeProvider.
 */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // Rendered on the client, where THEME_INIT_SCRIPT never runs.
  useLayoutEffect(applyStoredTheme, []);
  return (
    // suppressHydrationWarning: applyStoredTheme adds data-theme.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>{`Something broke · ${SITE_NAME}`}</title>
      </head>
      <body className="flex min-h-screen flex-col">
        <RuntimeError {...props} />
      </body>
    </html>
  );
}
