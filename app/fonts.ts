import localFont from "next/font/local";

/**
 * Inter (variable, Latin), self-hosted so every visitor and the export's browser use the same font;
 * a system font would make the preview and the downloaded PNG differ. SIL Open Font License.
 */
export const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
