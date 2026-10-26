import {
  CONTENT_ALIGNS,
  normalizeContentAlign,
  type ContentAlign,
} from "@/src/banner/contentAlign";
import { positionOr, type Position } from "@/src/banner/position";

/**
 * Where the content sits in the padded box, as a placement (see `placement.ts`).
 */
export type ContentPosition = Position;

/** Each alignment's place on the x axis. By default the content is centered vertically. */
const ALIGN_X: Record<ContentAlign, number> = { left: 0, center: 50, right: 100 };

const MIDDLE = 50;

/** The content's position from banner state: a moved one, or its alignment, centered vertically. */
export function contentPositionFromState(state: Record<string, unknown>): ContentPosition {
  return positionOr(state.contentPosition, {
    x: ALIGN_X[normalizeContentAlign(state.alignment)],
    y: MIDDLE,
  });
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
