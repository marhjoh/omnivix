"use client";

import { useLayoutEffect } from "react";
import { SITE_NAME } from "@/src/lib/site";
import { applyStoredTheme } from "@/src/theme/theme";
import { RuntimeError } from "@/src/landing/RuntimeError";
import { inter } from "./fonts";
import "./globals.css";

/**
 * An error in the root layout itself. It replaces the layout, so it brings its own document,
 * styles, font and theme. No header: its theme toggle needs the layout's ThemeProvider.
 */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // Next builds this document on the client, so the layout's inline theme script never runs here.
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
