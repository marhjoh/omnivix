import { contentBox } from "@/src/banner/fit";
import { clampPercent, roundPercent, type Position } from "@/src/banner/position";
import type { BannerBox } from "@/src/lib/sizes";

/**
 * Placing an item (the content, the logo) in the banner's padded box (`contentBox`). Its position
 * is a percentage of the room left around it: 0 is the left/top, 100 the right/bottom. Like the
 * background's position, it carries over when the format or the item's size changes.
 */

/** Mark the items the banner places, so the studio preview can find them to drag. */
export const BANNER_CONTENT_ATTRIBUTE = "data-banner-content";
export const BANNER_LOGO_ATTRIBUTE = "data-banner-logo";

/** Where an item snaps while dragged: an edge or the middle of the box, on each axis. */
const SNAP_POINTS = [0, 50, 100];

interface Size {
  width: number;
  height: number;
}

/** CSS that places an item at `position` in the room inside its box, with no measuring. */
export function placementStyle({ x, y }: Position) {
  return {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-${x}%, -${y}%)`,
  } as const;
}

/** How far (in banner pixels) an item of this size can move on each axis inside the padded box. */
export function placementRoom(banner: BannerBox, item: Size): Size {
  const box = contentBox(banner);
  return {
    width: Math.max(0, box.width - item.width),
    height: Math.max(0, box.height - item.height),
  };
}

/**
 * The position after dragging an item by `delta` banner pixels, so it follows the pointer. Within
 * `snapDistance` of an edge or the middle it snaps there; `snapped` names those points, for the
 * guide lines. Axes without room stay as they are.
 */
export function dragPlacement(
  from: Position,
  delta: { x: number; y: number },
  room: Size,
  snapDistance: number,
): { position: Position; snapped: Partial<Position> } {
  const snapped: Partial<Position> = {};
  const move = (axis: "x" | "y", by: number, space: number) => {
    if (space < 1) return from[axis];
    const next = clampPercent(from[axis] + (by / space) * 100);
    const snap = SNAP_POINTS.find(
      (point) => (Math.abs(next - point) / 100) * space <= snapDistance,
    );
    if (snap === undefined) return roundPercent(next);
    snapped[axis] = snap;
    return snap;
  };
  return {
    position: { x: move("x", delta.x, room.width), y: move("y", delta.y, room.height) },
    snapped,
  };
}

/** The position after an arrow key: `step` percent on each axis that has room to move. */
export function nudgePlacement(
  from: Position,
  step: { x: number; y: number },
  room: Size,
): Position {
  const move = (value: number, by: number, space: number) =>
    space < 1 ? value : roundPercent(clampPercent(value + by));
  return { x: move(from.x, step.x, room.width), y: move(from.y, step.y, room.height) };
}

/**
 * A snap point's place in banner pixels, for its guide line: the box's left edge, middle or
 * right edge (top, middle or bottom for y), where the item's matching edge or middle sits.
 */
export function snapLine(banner: BannerBox, axis: "x" | "y", point: number): number {
  const { left, top, width, height } = contentBox(banner);
  return axis === "x" ? left + (width * point) / 100 : top + (height * point) / 100;
}
