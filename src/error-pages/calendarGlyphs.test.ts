import { describe, expect, it } from "vitest";
import { calendarColumns, ERROR_CODES, GLYPHS } from "./calendarGlyphs";

describe("GLYPHS", () => {
  it("are 5 × 7 pixels", () => {
    for (const [glyph, rows] of Object.entries(GLYPHS)) {
      expect(rows, glyph).toHaveLength(7);
      for (const row of rows) expect(row, glyph).toMatch(/^[01]{5}$/);
    }
  });
});

describe("calendarColumns", () => {
  it("spells every code with known glyphs, a week per column", () => {
    for (const code of ERROR_CODES) {
      for (const glyph of code) expect(GLYPHS[glyph], `${code}: ${glyph}`).toBeDefined();
      const columns = calendarColumns(code);
      // Padding, then a gap and five columns per glyph, then padding.
      expect(columns).toHaveLength(1 + code.length * 6 + 2);
      for (const column of columns) expect(column).toHaveLength(7);
    }
  });

  it("lights the 4's crossbar", () => {
    const columns = calendarColumns("404");
    expect(columns.slice(2, 7).map((column) => column[3])).toEqual([true, true, true, true, true]);
  });
});
