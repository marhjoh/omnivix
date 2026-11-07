import { contentBoxOf } from "@/src/banner/fit";
import { samePosition, type Position } from "@/src/banner/position";
import type { BaseSettings } from "@/src/templates/stateSchemas";

/** The Alignment setting. It sets the content's x position. */
export const CONTENT_ALIGNS = ["left", "center", "right"] as const;

export type ContentAlign = (typeof CONTENT_ALIGNS)[number];

export const CONTENT_ALIGN_OPTIONS = CONTENT_ALIGNS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

export const DEFAULT_CONTENT_ALIGN: ContentAlign = "center";

const ALIGN_X: Record<ContentAlign, number> = { left: 0, center: 50, right: 100 };

const MIDDLE = 50;

function defaultContentPosition(state: BaseSettings): Position {
  return { x: ALIGN_X[state.alignment], y: MIDDLE };
}

export function contentPositionFromState(state: BaseSettings): Position {
  return state.contentPosition ?? defaultContentPosition(state);
}

/** Props for FitContent: the format's padded box and the content's position. */
export function contentFit(state: BaseSettings) {
  return { box: contentBoxOf(state.size), position: contentPositionFromState(state) };
}

/** The alignment at this x, or undefined when a free drag left the content between them. */
export function alignmentAt(x: number): ContentAlign | undefined {
  return CONTENT_ALIGNS.find((align) => ALIGN_X[align] === x);
}

/**
 * The alignment the sidebar shows as selected. It's undefined unless the content sits at one of the
 * three spots, centered vertically.
 */
export function alignmentShown({ x, y }: Position): ContentAlign | undefined {
  return y === MIDDLE ? alignmentAt(x) : undefined;
}

/** True at its default position, so there's nothing to reset. */
export function isDefaultContentPosition(state: BaseSettings): boolean {
  return samePosition(contentPositionFromState(state), defaultContentPosition(state));
}
