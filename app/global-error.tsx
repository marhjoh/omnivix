"use client";

import { useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import type { RuntimeErrorProps } from "@/src/error-pages/RuntimeError";
import { applyStoredTheme } from "@/src/theme/theme";
import { inter } from "./fonts";
import "./globals.css";

// Loaded only on an error, as every page loads this boundary.
const RuntimeError = dynamic(() =>
  import("@/src/error-pages/RuntimeError").then((m) => m.RuntimeError),
);

/**
 * Errors in the root layout. Replaces it, so it brings its own document, styles and font.
 * No header: the theme toggle needs ThemeProvider.
 */
export default function GlobalError(props: RuntimeErrorProps) {
  // Rendered on the client, where THEME_INIT_SCRIPT never runs.
  useLayoutEffect(applyStoredTheme, []);
  return (
    // suppressHydrationWarning: applyStoredTheme adds data-theme.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="flex min-h-screen flex-col">
        <RuntimeError {...props} />
      </body>
    </html>
  );
}
