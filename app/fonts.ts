import localFont from "next/font/local";

/**
 * Inter, self-hosted so the preview and the exported banner use the same font.
 * SIL Open Font License.
 */
export const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

/*
 * The quote and terminal banners' fonts (src/banner/quoteStyle.ts), from Fontsource. SIL Open Font
 * License or Apache License 2.0. Only those banners use them, so they aren't preloaded.
 */

const interItalic = localFont({
  src: "./fonts/inter-latin-variable-italic.woff2",
  style: "italic",
  weight: "100 900",
  variable: "--font-inter-italic",
  display: "swap",
  preload: false,
});

const sourceSerif = localFont({
  src: [
    { path: "./fonts/source-serif-4-latin-variable.woff2", style: "normal" },
    { path: "./fonts/source-serif-4-latin-variable-italic.woff2", style: "italic" },
  ],
  weight: "200 900",
  variable: "--font-source-serif",
  display: "swap",
  preload: false,
});

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin-variable.woff2", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin-variable-italic.woff2", style: "italic" },
  ],
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

const dmSans = localFont({
  src: [
    { path: "./fonts/dm-sans-latin-variable.woff2", style: "normal" },
    { path: "./fonts/dm-sans-latin-variable-italic.woff2", style: "italic" },
  ],
  weight: "100 1000",
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-variable.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

const outfit = localFont({
  src: "./fonts/outfit-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-outfit",
  display: "swap",
  preload: false,
});

const playfairDisplay = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-variable.woff2", style: "normal" },
    { path: "./fonts/playfair-display-latin-variable-italic.woff2", style: "italic" },
  ],
  weight: "400 900",
  variable: "--font-playfair-display",
  display: "swap",
  preload: false,
});

const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin-variable.woff2", style: "normal" },
    { path: "./fonts/fraunces-latin-variable-italic.woff2", style: "italic" },
  ],
  weight: "100 900",
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

const robotoSlab = localFont({
  src: "./fonts/roboto-slab-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-roboto-slab",
  display: "swap",
  preload: false,
});

const firaCode = localFont({
  src: "./fonts/fira-code-latin-variable.woff2",
  weight: "300 700",
  variable: "--font-fira-code",
  display: "swap",
  preload: false,
});

const caveat = localFont({
  src: "./fonts/caveat-latin-variable.woff2",
  weight: "400 700",
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

/** The quote fonts' CSS variables, for the root element. */
export const quoteFontVariables = [
  interItalic,
  sourceSerif,
  jetbrainsMono,
  dmSans,
  spaceGrotesk,
  outfit,
  playfairDisplay,
  fraunces,
  robotoSlab,
  firaCode,
  caveat,
]
  .map((font) => font.variable)
  .join(" ");
