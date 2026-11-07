import { describe, expect, it } from "vitest";
import {
  colorValue,
  fontStyleOptions,
  fontStyleShown,
  isQuoteColor,
  PALETTE,
  quoteStyleFromState,
} from "./quoteStyle";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateSettings } from "@/src/templates/stateSchemas";
import type { Theme } from "@/src/theme/theme";

/** The quote's style with `settings` over the quote banner's defaults. */
function quoteStyle(settings: Partial<TemplateSettings["quote-banner"]>, uiTheme: Theme) {
  return quoteStyleFromState(
    { ...templateRegistry["quote-banner"].initialState, ...settings },
    uiTheme,
  );
}

/** WCAG contrast ratio between two hex colors. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("quoteStyleFromState", () => {
  it("is bold Inter with curly marks in the text color by default", () => {
    expect(quoteStyle({}, "dark")).toMatchObject({
      fontFamily: "var(--font-inter), sans-serif",
      fontWeight: 700,
      fontStyle: "normal",
      marks: "curly",
      color: undefined,
      markColor: undefined,
      authorColor: undefined,
      authorPrefix: "— ",
    });
  });

  it("sets the author's color and what comes before the name", () => {
    expect(quoteStyle({ authorColor: "amber", authorPrefix: "tilde" }, "light")).toMatchObject({
      authorColor: "#b45309",
      authorPrefix: "~ ",
    });
    expect(quoteStyle({ authorPrefix: "none" }, "dark").authorPrefix).toBe("");
  });

  it("uses Inter's own italic, and the font's italic style elsewhere", () => {
    expect(quoteStyle({ fontStyle: "italic" }, "dark")).toMatchObject({
      fontFamily: "var(--font-inter-italic), sans-serif",
      authorFontFamily: "var(--font-inter), sans-serif",
      fontWeight: 400,
      fontStyle: "italic",
    });
    expect(
      quoteStyle({ font: "playfair-display", fontStyle: "semibold-italic" }, "dark"),
    ).toMatchObject({
      fontFamily: "var(--font-playfair-display), serif",
      fontWeight: 600,
      fontStyle: "italic",
    });
  });

  it("sets a font without an italic upright, keeping the weight", () => {
    expect(quoteStyle({ font: "caveat", fontStyle: "bold-italic" }, "dark")).toMatchObject({
      fontFamily: "var(--font-caveat), cursive",
      fontWeight: 700,
      fontStyle: "normal",
    });
  });

  it("sets text marks around the text, but not for the decorative styles", () => {
    expect(quoteStyle({ quoteMarks: "guillemets" }, "dark").textMarks).toEqual(["«", "»"]);
    expect(quoteStyle({ quoteMarks: "large-above" }, "dark").textMarks).toBeUndefined();
  });

  it("colors the marks like the quote unless they have their own color", () => {
    expect(quoteStyle({ quoteColor: "blue" }, "dark").markColor).toBe("#60a5fa");
    expect(quoteStyle({ quoteColor: "blue", markColor: "#ff6600" }, "dark").markColor).toBe(
      "#ff6600",
    );
  });
});

describe("fontStyleOptions and fontStyleShown", () => {
  it("offers only upright styles for a font without an italic", () => {
    expect(fontStyleOptions("inter").map((o) => o.value)).toContain("bold-italic");
    expect(fontStyleOptions("fira-code").map((o) => o.value)).toEqual([
      "regular",
      "semibold",
      "bold",
    ]);
    expect(fontStyleShown("fira-code", "italic")).toBe("regular");
    expect(fontStyleShown("fira-code", "semibold-italic")).toBe("semibold");
    expect(fontStyleShown("fraunces", "semibold-italic")).toBe("semibold-italic");
  });
});

describe("colors", () => {
  it.each(Object.entries(PALETTE))("%s has 3:1 contrast on light and dark banners", (_, c) => {
    expect(contrast(c.light, "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrast(c.dark, "#0d1117")).toBeGreaterThanOrEqual(3);
  });

  it("takes the theme's shade and uses a hex code as is", () => {
    expect(colorValue("green", "light")).toBe(PALETTE.green.light);
    expect(colorValue("green", "dark")).toBe(PALETTE.green.dark);
    expect(colorValue("#FF6600", "light")).toBe("#FF6600");
    expect(colorValue("default", "dark")).toBeUndefined();
  });

  it("accepts named colors and six-digit hex codes only", () => {
    expect(isQuoteColor("violet")).toBe(true);
    expect(isQuoteColor("#a1b2c3")).toBe(true);
    expect(isQuoteColor("#abc")).toBe(false);
    expect(isQuoteColor("purple")).toBe(false);
  });
});
