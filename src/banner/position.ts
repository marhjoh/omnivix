/**
 * A point in percent: 0 is the left/top, 100 the right/bottom. The background uses it as CSS
 * `object-position`; the content as its place in the room left around it (`contentPosition.ts`).
 */
export interface Position {
  x: number;
  y: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function isPosition(raw: unknown): raw is Position {
  return (
    typeof raw === "object" &&
    raw !== null &&
    Number.isFinite((raw as Position).x) &&
    Number.isFinite((raw as Position).y)
  );
}

export function clampPosition({ x, y }: Position): Position {
  return { x: clamp(x), y: clamp(y) };
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
