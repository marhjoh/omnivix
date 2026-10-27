import { describe, expect, it } from "vitest";
import {
  colorValue,
  fontStyleOptions,
  fontStyleShown,
  isQuoteColor,
  PALETTE,
  quoteStyleFromState,
} from "./quoteStyle";

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
    expect(quoteStyleFromState({}, "dark")).toEqual({
      fontFamily: "var(--font-inter), sans-serif",
      authorFontFamily: "var(--font-inter), sans-serif",
      fontWeight: 700,
      fontStyle: "normal",
      letterSpacing: "-0.02em",
      xHeight: 0.55,
      marks: "curly",
      textMarks: ["“", "”"],
      color: undefined,
      markColor: undefined,
      authorColor: undefined,
      authorPrefix: "— ",
    });
  });

  it("sets the author's color and what comes before the name", () => {
    expect(
      quoteStyleFromState({ authorColor: "amber", authorPrefix: "tilde" }, "light"),
    ).toMatchObject({ authorColor: "#b45309", authorPrefix: "~ " });
    expect(quoteStyleFromState({ authorPrefix: "none" }, "dark").authorPrefix).toBe("");
  });

  it("uses Inter's own italic, and the font's italic style elsewhere", () => {
    expect(quoteStyleFromState({ fontStyle: "italic" }, "dark")).toMatchObject({
      fontFamily: "var(--font-inter-italic), sans-serif",
      authorFontFamily: "var(--font-inter), sans-serif",
      fontWeight: 400,
      fontStyle: "italic",
    });
    expect(
      quoteStyleFromState({ font: "playfair-display", fontStyle: "semibold-italic" }, "dark"),
    ).toMatchObject({
      fontFamily: "var(--font-playfair-display), serif",
      fontWeight: 600,
      fontStyle: "italic",
    });
  });

  it("sets a font without an italic upright, keeping the weight", () => {
    expect(quoteStyleFromState({ font: "caveat", fontStyle: "bold-italic" }, "dark")).toMatchObject(
      { fontFamily: "var(--font-caveat), cursive", fontWeight: 700, fontStyle: "normal" },
    );
  });

  it("sets text marks around the text, but not for the decorative styles", () => {
    expect(quoteStyleFromState({ quoteMarks: "guillemets" }, "dark").textMarks).toEqual(["«", "»"]);
    expect(quoteStyleFromState({ quoteMarks: "large-above" }, "dark").textMarks).toBeUndefined();
  });

  it("colors the marks like the quote unless they have their own color", () => {
    expect(quoteStyleFromState({ quoteColor: "blue" }, "dark").markColor).toBe("#60a5fa");
    expect(
      quoteStyleFromState({ quoteColor: "blue", markColor: "#ff6600" }, "dark").markColor,
    ).toBe("#ff6600");
  });

  it("falls back to the defaults for unknown values", () => {
    expect(
      quoteStyleFromState(
        { font: "comic", fontStyle: "wavy", quoteMarks: "x", quoteColor: 1, markColor: "#12" },
        "light",
      ),
    ).toEqual(quoteStyleFromState({}, "light"));
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

  it("takes a deeper shade on light banners and uses a hex code as is", () => {
    expect(colorValue("green", "light")).toBe("#15803d");
    expect(colorValue("green", "dark")).toBe("#4ade80");
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
