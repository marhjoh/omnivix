import { contentBoxOf } from "@/src/banner/fit";
import { positionOr, samePosition, type Position } from "@/src/banner/position";
import { oneOfOr } from "@/src/lib/isOneOf";

/** The Alignment setting: the content's horizontal place (its x in the content position). */
export const CONTENT_ALIGNS = ["left", "center", "right"] as const;

export type ContentAlign = (typeof CONTENT_ALIGNS)[number];

export const CONTENT_ALIGN_OPTIONS = CONTENT_ALIGNS.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

export const DEFAULT_CONTENT_ALIGN: ContentAlign = "center";

/** Centered unless the setting is a valid alignment. */
function normalizeContentAlign(raw: unknown): ContentAlign {
  return oneOfOr(CONTENT_ALIGNS, raw, DEFAULT_CONTENT_ALIGN);
}

/**
 * Where the content sits in the padded box, as a placement (see `placement.ts`).
 */
export type ContentPosition = Position;

/** Each alignment's place on the x axis. By default the content is centered vertically. */
const ALIGN_X: Record<ContentAlign, number> = { left: 0, center: 50, right: 100 };

const MIDDLE = 50;

/** Where the content is until it's moved: at its alignment, centered vertically. */
function defaultContentPosition(state: Record<string, unknown>): ContentPosition {
  return { x: ALIGN_X[normalizeContentAlign(state.alignment)], y: MIDDLE };
}

/** The content's position from banner state: a moved one, or its default. */
export function contentPositionFromState(state: Record<string, unknown>): ContentPosition {
  return positionOr(state.contentPosition, defaultContentPosition(state));
}

/** Where `FitContent` puts the content: in the format's padded box, at its position. */
export function contentFit(state: Record<string, unknown>) {
  return { box: contentBoxOf(state.size), position: contentPositionFromState(state) };
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

/** True at its default position, so there's nothing to reset. */
export function isDefaultContentPosition(state: Record<string, unknown>): boolean {
  return samePosition(contentPositionFromState(state), defaultContentPosition(state));
}
