import { contentBox } from "@/src/banner/fit";
import { clampPercent, roundPercent, type Position } from "@/src/banner/position";
import type { BannerBox, Box } from "@/src/lib/sizes";

/**
 * Places the content or the logo in the banner's padded box (`contentBox`). A position is a
 * percentage of the room left around the item, from 0 (left or top) to 100 (right or bottom).
 * Because it's relative, it carries over when the format or the item's size changes.
 */

/** Mark the items the banner places, so the studio preview can find them to drag. */
export const BANNER_CONTENT_ATTRIBUTE = "data-banner-content";
export const BANNER_LOGO_ATTRIBUTE = "data-banner-logo";
/** Marks the background image, whose natural size the preview needs to pan it. */
export const BANNER_BACKGROUND_ATTRIBUTE = "data-banner-background";

/** The class on Frame's root. The export screenshots this element. */
export const BANNER_ROOT_CLASS = "banner-export-root";

/** While dragging, items snap to the edges and the middle of the box. */
const SNAP_POINTS = [0, 50, 100];

/** CSS that places an item at `position` without measuring it. */
export function placementStyle({ x, y }: Position) {
  return {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-${x}%, -${y}%)`,
  } as const;
}

/** How far (in banner pixels) an item of this size can move on each axis inside the padded box. */
export function placementRoom(banner: BannerBox, item: Box): Box {
  const box = contentBox(banner);
  return {
    width: Math.max(0, box.width - item.width),
    height: Math.max(0, box.height - item.height),
  };
}

/**
 * The position after dragging an item by `delta` banner pixels. Within `snapDistance` of an edge
 * or the middle, it snaps there, and `snapped` lists those points for the guide lines. An axis
 * with no room stays put.
 */
export function dragPlacement(
  from: Position,
  delta: { x: number; y: number },
  room: Box,
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
  room: Box,
): Position {
  const move = (value: number, by: number, space: number) =>
    space < 1 ? value : roundPercent(clampPercent(value + by));
  return { x: move(from.x, step.x, room.width), y: move(from.y, step.y, room.height) };
}

/** Where a snap point's guide line goes, in banner pixels: the padded box's edge or middle. */
export function snapLine(banner: BannerBox, axis: "x" | "y", point: number): number {
  const { left, top, width, height } = contentBox(banner);
  return axis === "x" ? left + (width * point) / 100 : top + (height * point) / 100;
}
