import { themePresetById } from "@/src/types/theme";

/** 5 × 7 pixel glyphs. */
export const GLYPHS: Record<string, readonly string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
};

/** Codes the error pages spell, with their grid colors. */
const CODE_THEMES = { "404": "ocean", ERR: "alternate" } as const;

export type ErrorCode = keyof typeof CODE_THEMES;

export const ERROR_CODES = Object.keys(CODE_THEMES) as ErrorCode[];

/** Color of the lit cells. */
export function codeColor(code: ErrorCode): string {
  return themePresetById(CODE_THEMES[code]).gridLevels[4];
}

/** One column per week: two blank columns on each side, one between glyphs. */
export function calendarColumns(code: ErrorCode): boolean[][] {
  const blank = Array<boolean>(7).fill(false);
  const columns = [...code].flatMap((glyph) => [
    blank,
    ...Array.from({ length: 5 }, (_, x) => GLYPHS[glyph].map((row) => row[x] === "1")),
  ]);
  return [blank, ...columns, blank, blank];
}

/** Stable pseudo-random scatter of quiet days. */
export function isQuietDay(x: number, y: number): boolean {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n) >= 0.9;
}
