import { clamp } from "@/src/lib/math";

/**
 * A point in percent, from 0 (left or top) to 100 (right or bottom). The background uses it as CSS
 * `object-position`. The content and the logo use it to place themselves (see placement.ts).
 */
export interface Position {
  x: number;
  y: number;
}

export const clampPercent = (value: number) => clamp(value, 0, 100);

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Rounds a percentage to 0.1, which is finer than a pixel at any banner size. */
export const roundPercent = (value: number) => Math.round(value * 10) / 10;

/** Rounds both axes to 0.1. Dragged positions are saved this way. */
export function roundPosition({ x, y }: Position): Position {
  return { x: roundPercent(x), y: roundPercent(y) };
}

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

/** Parses a studio link's position, like `100,0`. Null unless both are numbers from 0 to 100. */
export function parsePositionText(text: string): Position | null {
  const parts = text.split(",");
  if (parts.length !== 2 || parts.some((part) => part.trim() === "")) return null;
  const [x, y] = parts.map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y };
}
