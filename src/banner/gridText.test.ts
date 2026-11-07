import { describe, expect, it } from "vitest";
import { GLYPHS, GRID_TEXT_COLUMNS, gridTextCells, isGridText, toGridText } from "./gridText";

describe("GLYPHS", () => {
  it.each(Object.entries(GLYPHS))("draws %j 5 cells tall, every row the same width", (_, rows) => {
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((row) => row.length)).size).toBe(1);
  });
});

describe("isGridText", () => {
  it("takes letters in either case, digits and a few signs", () => {
    expect(isGridText("Hi 2026!")).toBe(true);
    expect(isGridText("")).toBe(true);
  });

  it("refuses characters without a glyph and text wider than the grid", () => {
    expect(isGridText("a@b")).toBe(false);
    expect(isGridText("WWWWWWWWWW")).toBe(false);
  });
});

describe("toGridText", () => {
  it("drops characters without a glyph and stops at the last one that fits", () => {
    expect(toGridText("hi, @you")).toBe("hi you");
    expect(isGridText(toGridText("M".repeat(40)))).toBe(true);
  });
});

describe("gridTextCells", () => {
  it("centers the text on Monday to Friday, inside the full weeks", () => {
    const cells = [...gridTextCells("I", 53)].map((cell) => cell.split(",").map(Number));
    const cols = cells.map(([col]) => col);
    const rows = cells.map(([, row]) => row);
    expect(Math.min(...rows)).toBe(1);
    expect(Math.max(...rows)).toBe(5);
    // 3 columns centered in columns 1–51.
    expect([Math.min(...cols), Math.max(...cols)]).toEqual([25, 27]);
  });

  it("keeps the widest text off the first and last week", () => {
    const text = toGridText("M".repeat(40));
    const cols = [...gridTextCells(text, GRID_TEXT_COLUMNS + 2)].map((cell) =>
      Number(cell.split(",")[0]),
    );
    expect(Math.min(...cols)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...cols)).toBeLessThanOrEqual(GRID_TEXT_COLUMNS);
  });
});

describe("gridTextCells in part of the grid", () => {
  it("draws only the whole characters that fit, centered", () => {
    // "HI" is 3 + 1 + 3 columns. In 5 columns only "H" fits.
    const cols = [...gridTextCells("HI", 53, 5)].map((cell) => Number(cell.split(",")[0]));
    expect([Math.min(...cols), Math.max(...cols)]).toEqual([25, 27]);
  });
});

describe("gridTextCells centering", () => {
  it("leaves out spaces at the ends, including one before a character that didn't fit", () => {
    const columns = (text: string, visible?: number) =>
      [...gridTextCells(text, 53, visible)].map((cell) => Number(cell.split(",")[0]));
    const plain = columns("HI");
    expect(columns(" HI ")).toEqual(plain);
    // "HI T" in 9 columns keeps "HI " and drops the T.
    expect(columns("HI T", 9)).toEqual(plain);
  });
});
