import { isOneOf } from "@/src/lib/isOneOf";
import type { Theme } from "@/src/theme/theme";

/** The quote banner's typography: font, weight and italic, quote marks, and their colors. */

export const QUOTE_FONTS = [
  "inter",
  "dm-sans",
  "space-grotesk",
  "outfit",
  "source-serif",
  "playfair-display",
  "fraunces",
  "roboto-slab",
  "jetbrains-mono",
  "fira-code",
  "caveat",
] as const;
export const QUOTE_FONT_STYLES = [
  "regular",
  "italic",
  "semibold",
  "semibold-italic",
  "bold",
  "bold-italic",
] as const;
export const QUOTE_MARKS = [
  "curly",
  "single",
  "guillemets",
  "low-high",
  "straight",
  "large-above",
  "large-beside",
  "large-behind",
  "bar",
  "none",
] as const;
export const AUTHOR_PREFIXES = ["em-dash", "en-dash", "tilde", "none"] as const;
const QUOTE_COLORS = [
  "default",
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "cyan",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "pink",
] as const;

export type QuoteFont = (typeof QUOTE_FONTS)[number];
export type QuoteFontStyle = (typeof QUOTE_FONT_STYLES)[number];
export type QuoteMarks = (typeof QUOTE_MARKS)[number];
type QuoteColor = (typeof QUOTE_COLORS)[number];
export type AuthorPrefix = (typeof AUTHOR_PREFIXES)[number];

export const DEFAULT_QUOTE_STYLE = {
  font: "inter",
  fontStyle: "bold",
  quoteMarks: "curly",
  quoteColor: "default",
  markColor: "default",
  authorColor: "default",
  authorPrefix: "em-dash",
} as const satisfies {
  font: QuoteFont;
  fontStyle: QuoteFontStyle;
  quoteMarks: QuoteMarks;
  quoteColor: QuoteColor;
  markColor: QuoteColor;
  authorColor: QuoteColor;
  authorPrefix: AuthorPrefix;
};

/**
 * Each font (app/fonts.ts) with its italic (none, in the same family, or a font of its own), its
 * letter spacing, and its lowercase height: every font is sized to it so all look the same size.
 * Serifs and Caveat sit lower, keeping their tall capitals in scale; monos too, as they're wide.
 */
const FONTS: Record<
  QuoteFont,
  {
    label: string;
    variable: string;
    fallback: string;
    /** "same" when the family has it; a CSS variable when it's a font of its own. */
    italic: "none" | "same" | `--${string}`;
    letterSpacing: string;
    xHeight: number;
  }
> = {
  inter: {
    label: "Inter",
    variable: "--font-inter",
    fallback: "sans-serif",
    italic: "--font-inter-italic",
    letterSpacing: "-0.02em",
    xHeight: 0.55,
  },
  "dm-sans": {
    label: "DM Sans",
    variable: "--font-dm-sans",
    fallback: "sans-serif",
    italic: "same",
    letterSpacing: "-0.02em",
    xHeight: 0.55,
  },
  "space-grotesk": {
    label: "Space Grotesk",
    variable: "--font-space-grotesk",
    fallback: "sans-serif",
    italic: "none",
    letterSpacing: "-0.02em",
    xHeight: 0.55,
  },
  outfit: {
    label: "Outfit",
    variable: "--font-outfit",
    fallback: "sans-serif",
    italic: "none",
    letterSpacing: "-0.01em",
    xHeight: 0.55,
  },
  "source-serif": {
    label: "Source Serif",
    variable: "--font-source-serif",
    fallback: "serif",
    italic: "same",
    letterSpacing: "-0.01em",
    xHeight: 0.53,
  },
  "playfair-display": {
    label: "Playfair Display",
    variable: "--font-playfair-display",
    fallback: "serif",
    italic: "same",
    letterSpacing: "0em",
    xHeight: 0.53,
  },
  fraunces: {
    label: "Fraunces",
    variable: "--font-fraunces",
    fallback: "serif",
    italic: "same",
    letterSpacing: "-0.01em",
    xHeight: 0.52,
  },
  "roboto-slab": {
    label: "Roboto Slab",
    variable: "--font-roboto-slab",
    fallback: "serif",
    italic: "none",
    letterSpacing: "-0.01em",
    xHeight: 0.55,
  },
  "jetbrains-mono": {
    label: "JetBrains Mono",
    variable: "--font-jetbrains-mono",
    fallback: "monospace",
    italic: "same",
    letterSpacing: "-0.02em",
    xHeight: 0.46,
  },
  "fira-code": {
    label: "Fira Code",
    variable: "--font-fira-code",
    fallback: "monospace",
    italic: "none",
    letterSpacing: "-0.02em",
    xHeight: 0.46,
  },
  caveat: {
    label: "Caveat",
    variable: "--font-caveat",
    fallback: "cursive",
    italic: "none",
    letterSpacing: "0em",
    xHeight: 0.52,
  },
};

/** Each style's weight, and the upright style an italic one becomes in a font without italics. */
const FONT_STYLE: Record<
  QuoteFontStyle,
  { label: string; weight: number; italic: boolean; upright: QuoteFontStyle }
> = {
  regular: { label: "Regular", weight: 400, italic: false, upright: "regular" },
  italic: { label: "Italic", weight: 400, italic: true, upright: "regular" },
  semibold: { label: "Semibold", weight: 600, italic: false, upright: "semibold" },
  "semibold-italic": { label: "Semibold italic", weight: 600, italic: true, upright: "semibold" },
  bold: { label: "Bold", weight: 700, italic: false, upright: "bold" },
  "bold-italic": { label: "Bold italic", weight: 700, italic: true, upright: "bold" },
};

/** Marks around the text: opening and closing. */
const TEXT_MARKS = {
  curly: ["“", "”"],
  single: ["‘", "’"],
  guillemets: ["«", "»"],
  "low-high": ["„", "“"],
  straight: ['"', '"'],
} as const;

const TEXT_MARK_STYLES = Object.keys(TEXT_MARKS) as Array<keyof typeof TEXT_MARKS>;

const MARKS_LABEL: Record<QuoteMarks, string> = {
  curly: "Curly",
  single: "Single",
  guillemets: "Guillemets",
  "low-high": "Low-high",
  straight: "Straight",
  "large-above": "Large above",
  "large-beside": "Large beside",
  "large-behind": "Large behind",
  bar: "Bar",
  none: "None",
};

/** What comes before the author's name. */
const AUTHOR_PREFIX: Record<AuthorPrefix, { label: string; text: string }> = {
  "em-dash": { label: "Em dash", text: "— " },
  "en-dash": { label: "En dash", text: "– " },
  tilde: { label: "Tilde", text: "~ " },
  none: { label: "None", text: "" },
};

/**
 * The colors, with a deeper shade for light banners and a brighter one for dark, so each has at
 * least 3:1 contrast on its banner, the minimum for large text (quoteStyle.test.ts checks).
 */
export const PALETTE: Record<
  Exclude<QuoteColor, "default">,
  { label: string; light: string; dark: string }
> = {
  gray: { label: "Gray", light: "#6b7280", dark: "#9ca3af" },
  red: { label: "Red", light: "#dc2626", dark: "#f87171" },
  orange: { label: "Orange", light: "#c2410c", dark: "#fb923c" },
  amber: { label: "Amber", light: "#b45309", dark: "#fbbf24" },
  green: { label: "Green", light: "#15803d", dark: "#4ade80" },
  teal: { label: "Teal", light: "#0f766e", dark: "#2dd4bf" },
  cyan: { label: "Cyan", light: "#0e7490", dark: "#22d3ee" },
  blue: { label: "Blue", light: "#2563eb", dark: "#60a5fa" },
  indigo: { label: "Indigo", light: "#4f46e5", dark: "#818cf8" },
  violet: { label: "Violet", light: "#7c3aed", dark: "#a78bfa" },
  fuchsia: { label: "Fuchsia", light: "#c026d3", dark: "#e879f9" },
  pink: { label: "Pink", light: "#db2777", dark: "#f472b6" },
};

/** A color picked by hand, as a hex code; used as is in both themes. */
const CUSTOM_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isCustomColor(value: unknown): value is string {
  return typeof value === "string" && CUSTOM_COLOR_PATTERN.test(value);
}

/** A named color or a hex code. */
export function isQuoteColor(value: unknown): boolean {
  return isOneOf(QUOTE_COLORS, value) || isCustomColor(value);
}

export const QUOTE_FONT_OPTIONS = QUOTE_FONTS.map((value) => ({
  label: FONTS[value].label,
  value,
}));
export const QUOTE_FONT_STYLE_OPTIONS = QUOTE_FONT_STYLES.map((value) => ({
  label: FONT_STYLE[value].label,
  value,
}));
export const QUOTE_MARKS_OPTIONS = QUOTE_MARKS.map((value) => ({
  label: MARKS_LABEL[value],
  value,
}));
export const AUTHOR_PREFIX_OPTIONS = AUTHOR_PREFIXES.map((value) => ({
  label: AUTHOR_PREFIX[value].label,
  value,
  symbol: AUTHOR_PREFIX[value].text.trim(),
}));
export const QUOTE_COLOR_OPTIONS = QUOTE_COLORS.map((value) => ({
  label: value === "default" ? "Default" : PALETTE[value].label,
  value,
}));

/** Space above the author, in banner pixels. */
export const AUTHOR_GAP = 16;

/** The author's size as a share of the quote's, so the two keep in proportion. */
export const AUTHOR_SCALE = { xs: 0.3, s: 0.35, m: 0.42, l: 0.5, xl: 0.6 } as const;

/** The large marks' glyph: Source Serif's, the classic shape, whatever the quote's font. */
export const LARGE_MARK_FONT_FAMILY = "var(--font-source-serif), serif";

function fontOf(value: unknown): QuoteFont {
  return isOneOf(QUOTE_FONTS, value) ? value : DEFAULT_QUOTE_STYLE.font;
}

/** The font's CSS font-family, upright or italic. */
export function fontFamily(font: QuoteFont, italic = false): string {
  const { variable, fallback, italic: italicFont } = FONTS[font];
  const name = italic && italicFont !== "none" && italicFont !== "same" ? italicFont : variable;
  return `var(${name}), ${fallback}`;
}

/** A font style's CSS in a font, for showing it in its own look. */
export function fontStyleCss(font: unknown, fontStyle: QuoteFontStyle) {
  const { weight, italic } = FONT_STYLE[fontStyleShown(font, fontStyle)];
  return {
    fontFamily: fontFamily(fontOf(font), italic),
    fontWeight: weight,
    fontStyle: italic ? "italic" : "normal",
  } as const;
}

/** The marks set around the text in a style, if it has them (for previews). */
export function textMarksOf(marks: QuoteMarks): readonly [string, string] | undefined {
  return isOneOf(TEXT_MARK_STYLES, marks) ? TEXT_MARKS[marks] : undefined;
}

/** The font styles a font has: only the upright ones for a font without an italic. */
export function fontStyleOptions(font: unknown) {
  const hasItalic = FONTS[fontOf(font)].italic !== "none";
  return QUOTE_FONT_STYLE_OPTIONS.filter(({ value }) => hasItalic || !FONT_STYLE[value].italic);
}

/** The font style as the font shows it: upright when the font has no italic. */
export function fontStyleShown(font: unknown, fontStyle: unknown): QuoteFontStyle {
  const style = isOneOf(QUOTE_FONT_STYLES, fontStyle) ? fontStyle : DEFAULT_QUOTE_STYLE.fontStyle;
  return FONTS[fontOf(font)].italic === "none" ? FONT_STYLE[style].upright : style;
}

/** The color to draw with: undefined for Default, the banner's text color. */
export function colorValue(color: unknown, uiTheme: Theme): string | undefined {
  if (isCustomColor(color)) return color;
  if (!isOneOf(QUOTE_COLORS, color) || color === "default") return undefined;
  return PALETTE[color][uiTheme];
}

export interface QuoteStyle {
  fontFamily: string;
  /** The author line's: the font upright. */
  authorFontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  letterSpacing: string;
  /** Lowercase height as a share of the font size (CSS `font-size-adjust`). */
  xHeight: number;
  marks: QuoteMarks;
  /** Opening and closing marks, for the styles set around the text. */
  textMarks: readonly [string, string] | undefined;
  /** The quote's color, or undefined for the banner's text color. */
  color: string | undefined;
  /** The marks' and the bar's color: their own, or the quote's. */
  markColor: string | undefined;
  /** The author's color, or undefined for the banner's muted text color. */
  authorColor: string | undefined;
  /** Before the author's name, e.g. "— ". */
  authorPrefix: string;
}

/** The quote's typography from banner state; anything missing or unknown is the default. */
export function quoteStyleFromState(state: Record<string, unknown>, uiTheme: Theme): QuoteStyle {
  const font = fontOf(state.font);
  const style = FONT_STYLE[fontStyleShown(font, state.fontStyle)];
  const marks = isOneOf(QUOTE_MARKS, state.quoteMarks)
    ? state.quoteMarks
    : DEFAULT_QUOTE_STYLE.quoteMarks;
  const color = colorValue(state.quoteColor, uiTheme);
  return {
    fontFamily: fontFamily(font, style.italic),
    authorFontFamily: fontFamily(font),
    fontWeight: style.weight,
    fontStyle: style.italic ? "italic" : "normal",
    letterSpacing: FONTS[font].letterSpacing,
    xHeight: FONTS[font].xHeight,
    marks,
    textMarks: textMarksOf(marks),
    color,
    markColor: colorValue(state.markColor, uiTheme) ?? color,
    authorColor: colorValue(state.authorColor, uiTheme),
    authorPrefix:
      AUTHOR_PREFIX[
        isOneOf(AUTHOR_PREFIXES, state.authorPrefix)
          ? state.authorPrefix
          : DEFAULT_QUOTE_STYLE.authorPrefix
      ].text,
  };
}
