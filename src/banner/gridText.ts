/**
 * Text drawn in the contribution grid as pixel letters. Each glyph is 5 cells tall, so it sits on
 * Monday to Friday with Sunday and Saturday as margins. Rows are strings so a glyph can be read
 * at a glance: `#` is a lit cell.
 */
export const GLYPHS: Record<string, readonly string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "##.", "#..", "##.", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#", "##", ".#", ".#", ".#"],
  "2": ["##.", "..#", ".#.", "#..", "###"],
  "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "##.", "..#", "##."],
  "6": [".##", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "##."],
  " ": ["..", "..", "..", "..", ".."],
  "-": ["...", "...", "###", "...", "..."],
  ".": [".", ".", ".", ".", "#"],
  "!": ["#", "#", "#", ".", "#"],
  "?": ["##.", "..#", ".#.", "...", ".#."],
};

/** The glyphs' height in cells, and the weekday row their top row goes on (Monday). */
const GLYPH_ROWS = 5;
const TOP_ROW = 1;

/**
 * Columns the text may use. A year has at least 53 week columns, and the first and last can be
 * partial weeks, so the text keeps out of both.
 */
export const GRID_TEXT_COLUMNS = 51;

/** Enough for the narrowest text that fits, so the API can name a plain length limit too. */
export const GRID_TEXT_MAX_LENGTH = 26;

type Glyph = readonly string[];

function glyphOf(char: string): Glyph | undefined {
  return GLYPHS[char.toUpperCase()];
}

/** The columns the glyphs take, with one empty column between characters. */
function textWidth(glyphs: readonly Glyph[]): number {
  return glyphs.reduce((width, glyph) => width + glyph[0].length, 0) + glyphs.length - 1;
}

/** The characters of `input` that have a glyph, up to the last one that fits in `columns`. */
function fitText(input: string, columns: number): { text: string; glyphs: Glyph[] } {
  let text = "";
  const glyphs: Glyph[] = [];
  for (const char of input) {
    const glyph = glyphOf(char);
    if (!glyph) continue;
    if (textWidth([...glyphs, glyph]) > columns) break;
    glyphs.push(glyph);
    text += char;
  }
  return { text, glyphs };
}

/** True when every character has a glyph and the text fits the grid. Letters may be lowercase. */
export function isGridText(text: string): boolean {
  return fitText(text, GRID_TEXT_COLUMNS).text === text;
}

/** What the studio keeps of typed text: the characters with a glyph, up to the last that fits. */
export function toGridText(input: string): string {
  return fitText(input, GRID_TEXT_COLUMNS).text;
}

/**
 * The lit cells as `"col,row"`, centered in the grid. Only whole characters that fit in
 * `visibleColumns` are drawn, so Fill, which shows part of the grid, never cuts a letter.
 */
export function gridTextCells(
  text: string,
  columnCount: number,
  visibleColumns = GRID_TEXT_COLUMNS,
): ReadonlySet<string> {
  // Spaces at either end, or one left before a character that didn't fit, would push the text
  // off center.
  const shown = fitText(text.trim(), visibleColumns).text.trimEnd();
  const { glyphs } = fitText(shown, visibleColumns);
  const cells = new Set<string>();
  if (glyphs.length === 0) return cells;
  let col = Math.floor((columnCount - textWidth(glyphs)) / 2);
  for (const glyph of glyphs) {
    for (let row = 0; row < GLYPH_ROWS; row++) {
      for (let x = 0; x < glyph[row].length; x++) {
        if (glyph[row][x] === "#") cells.add(`${col + x},${TOP_ROW + row}`);
      }
    }
    col += glyph[0].length + 1;
  }
  return cells;
}
