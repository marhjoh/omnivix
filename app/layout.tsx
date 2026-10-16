import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_OPEN_GRAPH } from "@/src/lib/site";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/src/theme/theme";
import "./globals.css";

/**
 * Inter (variable, Latin), self-hosted so every visitor and the export's browser use the same font;
 * a system font would make the preview and the downloaded PNG differ. SIL Open Font License.
 */
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  // No url here: it would mark every page without its own (such as the 404 page) as the home page.
  openGraph: SITE_OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      {
        url: "/brand/icon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/brand/icon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/brand/site.webmanifest",
  // Google Search Console ownership check; removing it unverifies the site.
  verification: { google: "CH99E0UrpoR3FTE5rj6SxDSvMADkuXfctdmwFNyYhlo" },
};

/**
 * No cookies are read here, so pages that don't need them are prerendered. The theme comes from
 * THEME_INIT_SCRIPT, which sets data-theme before first paint; CSS and the themed artwork follow
 * it directly. The studio reads the theme cookie itself, since its banner preview picks colors in
 * JavaScript.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT adds data-theme before React hydrates.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider initialTheme={DEFAULT_THEME}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
