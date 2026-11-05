"use client";

import { useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import type { RuntimeErrorProps } from "@/src/error-pages/RuntimeError";
import { ERROR_PAGE_TITLE } from "@/src/lib/site";
import { applyStoredTheme } from "@/src/theme/theme";
import { inter } from "./fonts";
import "./globals.css";

// Loaded lazily because every page includes this boundary.
const RuntimeError = dynamic(() =>
  import("@/src/error-pages/RuntimeError").then((m) => m.RuntimeError),
);

/**
 * Errors in the root layout. It replaces the layout, so it renders its own <html>, styles and font.
 * There's no header because the theme toggle needs ThemeProvider.
 */
export default function GlobalError(props: RuntimeErrorProps) {
  // Rendered on the client, where THEME_INIT_SCRIPT never runs.
  useLayoutEffect(applyStoredTheme, []);
  return (
    // applyStoredTheme adds data-theme.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>{ERROR_PAGE_TITLE}</title>
      </head>
      <body className="flex min-h-screen flex-col">
        <RuntimeError {...props} />
      </body>
    </html>
  );
}
