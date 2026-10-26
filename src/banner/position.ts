/**
 * A point in percent: 0 is the left/top, 100 the right/bottom. The background uses it as CSS
 * `object-position`; the content and the logo as their place in the room left around them
 * (`placement.ts`).
 */
export interface Position {
  x: number;
  y: number;
}

/** Keeps a percentage between 0 and 100. */
export const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

/** Rounds a percentage to 0.1, which is finer than a pixel at any banner size. */
export const roundPercent = (value: number) => Math.round(value * 10) / 10;

export function isPosition(raw: unknown): raw is Position {
  return (
    typeof raw === "object" &&
    raw !== null &&
    Number.isFinite((raw as Position).x) &&
    Number.isFinite((raw as Position).y)
  );
}

export function clampPosition({ x, y }: Position): Position {
  return { x: clampPercent(x), y: clampPercent(y) };
}

/** A position from banner state, kept between 0 and 100, or `fallback` when there's none. */
export function positionOr(raw: unknown, fallback: Position): Position {
  return isPosition(raw) ? clampPosition(raw) : fallback;
}

/** A position in a studio link, e.g. `100,0`; null unless both are numbers from 0 to 100. */
export function parsePositionText(text: string): Position | null {
  const parts = text.split(",");
  if (parts.length !== 2 || parts.some((part) => part.trim() === "")) return null;
  const [x, y] = parts.map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y };
}
