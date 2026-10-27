import { clampPercent, roundPercent } from "@/src/banner/position";

/**
 * Where the quote banner's author sits under the quote: `x` across the quote's width (0 left,
 * 50 center, 100 right, like the alignment) and `y`, extra space above it in banner pixels. It's
 * part of the quote's block, so it moves with the quote and never leaves the padded box.
 */
export interface AuthorPosition {
  x: number;
  y: number;
}

/** The most extra space above the author: more than the tallest banner's padded box. */
export const MAX_AUTHOR_SPACE = 400;

export function isAuthorPosition(raw: unknown): raw is AuthorPosition {
  if (typeof raw !== "object" || raw === null) return false;
  const { x, y } = raw as AuthorPosition;
  const within = (n: number, max: number) => Number.isFinite(n) && n >= 0 && n <= max;
  return within(x, 100) && within(y, MAX_AUTHOR_SPACE);
}

/** The author's position once dragged, or undefined while it's lined up like the quote. */
export function authorPositionFromState(
  state: Record<string, unknown>,
): AuthorPosition | undefined {
  return isAuthorPosition(state.authorPosition) ? state.authorPosition : undefined;
}

/** A position in a studio link, e.g. `100,24`; null unless both are in range. */
export function parseAuthorPositionText(text: string): AuthorPosition | null {
  const parts = text.split(",");
  if (parts.length !== 2 || parts.some((part) => part.trim() === "")) return null;
  const [x, y] = parts.map(Number);
  return isAuthorPosition({ x, y }) ? { x, y } : null;
}

const ACROSS: Record<number, string> = { 0: "left", 50: "center", 100: "right" };

/** The position in words: "left, right under the quote", or "40% across, 24 pixels lower". */
export function describeAuthorPosition({ x, y }: AuthorPosition): string {
  const across = ACROSS[x] ?? `${Math.round(x)}% across`;
  return `${across}, ${y ? `${y} pixels lower` : "right under the quote"}`;
}

/** Where the author snaps across the quote: its left edge, center and right edge. */
const SNAP_POINTS = [0, 50, 100];

/**
 * The position after moving the author by `by` banner pixels: across `room.width`, the quote's
 * width less the author's, and down by at most `room.height`, the space left under the quote's
 * block. Within `snapDistance` pixels of the quote's edges or center, or of no extra space, it
 * snaps there; `snapped.x` names that point, for a guide line.
 */
export function moveAuthor(
  from: AuthorPosition,
  by: { x: number; y: number },
  room: { width: number; height: number },
  snapDistance = 0,
): { position: AuthorPosition; snapped: { x?: number } } {
  const snapped: { x?: number } = {};
  let x = from.x;
  if (room.width >= 1) {
    const next = clampPercent(from.x + (by.x / room.width) * 100);
    const snap = SNAP_POINTS.find(
      (point) => (Math.abs(next - point) / 100) * room.width <= snapDistance,
    );
    if (snap === undefined) x = roundPercent(next);
    else x = snapped.x = snap;
  }
  const y = Math.round(Math.min(Math.max(from.y + by.y, 0), from.y + Math.max(0, room.height)));
  return { position: { x, y: y <= snapDistance ? 0 : y }, snapped };
}
