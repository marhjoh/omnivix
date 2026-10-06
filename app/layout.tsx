import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { parseThemeCookie, THEME_COOKIE_NAME, THEME_INIT_SCRIPT } from "@/src/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omnivix",
  description: "Template-driven social banner generator",
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = parseThemeCookie(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT may change data-theme before React hydrates.
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-bg text-text antialiased">
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
