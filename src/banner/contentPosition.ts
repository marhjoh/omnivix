import {
  CONTENT_ALIGNS,
  normalizeContentAlign,
  type ContentAlign,
} from "@/src/banner/contentAlign";
import { contentBox } from "@/src/banner/fit";
import { clampPosition, isPosition, type Position } from "@/src/banner/position";

/**
 * Where the content sits in the padded content box (`contentBox`), as a percentage of the room
 * left around it: 0 is the left/top, 100 the right/bottom. Like the background's position, it
 * carries over when the format or the size changes.
 */
export type ContentPosition = Position;

/** Each alignment's place on the x axis. By default the content is centered vertically. */
export const ALIGN_X: Record<ContentAlign, number> = { left: 0, center: 50, right: 100 };

const MIDDLE = 50;

/** Where the content snaps while dragged: an edge or the middle of the box, on each axis. */
const SNAP_POINTS = [0, 50, 100];

interface Size {
  width: number;
  height: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

/** The content's position from banner state: a moved one, or its alignment, centered vertically. */
export function contentPositionFromState(state: Record<string, unknown>): ContentPosition {
  if (isPosition(state.contentPosition)) return clampPosition(state.contentPosition);
  return { x: ALIGN_X[normalizeContentAlign(state.alignment)], y: MIDDLE };
}

/** The alignment the content is at, or undefined between them (after a free drag). */
export function alignmentAt(x: number): ContentAlign | undefined {
  return CONTENT_ALIGNS.find((align) => ALIGN_X[align] === x);
}

/**
 * The alignment the sidebar shows: one of the three spots, centered vertically. Anywhere else the
 * content is at none of them.
 */
export function alignmentShown({ x, y }: ContentPosition): ContentAlign | undefined {
  return y === MIDDLE ? alignmentAt(x) : undefined;
}

/** True when the content is at its alignment and centered vertically, so there's nothing to reset. */
export function isDefaultContentPosition(state: Record<string, unknown>): boolean {
  const { x, y } = contentPositionFromState(state);
  return x === ALIGN_X[normalizeContentAlign(state.alignment)] && y === MIDDLE;
}

/** How far (in banner pixels) content of this size can move on each axis inside the content box. */
export function contentRoom(banner: Size, content: Size): Size {
  const box = contentBox(banner);
  return {
    width: Math.max(0, box.width - content.width),
    height: Math.max(0, box.height - content.height),
  };
}

/**
 * The position after dragging the content by `delta` banner pixels: the content follows the
 * pointer. Within `snapDistance` banner pixels of an edge or the middle it snaps there, and
 * `snapped` names those points, for the guide lines. Axes without room to move are left as they are.
 */
export function dragContentPosition(
  from: ContentPosition,
  delta: { x: number; y: number },
  room: Size,
  snapDistance: number,
): { position: ContentPosition; snapped: Partial<ContentPosition> } {
  const snapped: Partial<ContentPosition> = {};
  const move = (axis: "x" | "y", by: number, space: number) => {
    if (space < 1) return from[axis];
    const next = clamp(from[axis] + (by / space) * 100);
    const snap = SNAP_POINTS.find(
      (point) => (Math.abs(next - point) / 100) * space <= snapDistance,
    );
    if (snap === undefined) return round(next);
    snapped[axis] = snap;
    return snap;
  };
  return {
    position: { x: move("x", delta.x, room.width), y: move("y", delta.y, room.height) },
    snapped,
  };
}

/** The position after an arrow key: `step` percent on each axis that has room to move. */
export function nudgeContentPosition(
  from: ContentPosition,
  step: { x: number; y: number },
  room: Size,
): ContentPosition {
  const move = (value: number, by: number, space: number) =>
    space < 1 ? value : round(clamp(value + by));
  return { x: move(from.x, step.x, room.width), y: move(from.y, step.y, room.height) };
}

/**
 * A snap point's place in banner pixels, for its guide line: the box's left edge, middle or
 * right edge (top, middle or bottom for y), where the content's matching edge or middle sits.
 */
export function snapLine(banner: Size, axis: "x" | "y", point: number): number {
  const { inset, width, height } = contentBox(banner);
  return inset + ((axis === "x" ? width : height) * point) / 100;
}
