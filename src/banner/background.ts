import type { CSSProperties } from "react";
import { presetBySrc } from "@/src/backgrounds/presets";
import {
  clampPercent,
  positionOr,
  roundPosition,
  samePosition,
  type Position,
} from "@/src/banner/position";
import { clamp } from "@/src/lib/math";
import type { Box } from "@/src/lib/sizes";

export const MIN_BACKGROUND_ZOOM = 1;
export const MAX_BACKGROUND_ZOOM = 1.5;

/** As in CSS `object-position`: 0 is the left/top edge, 100 the right/bottom. */
export type BackgroundPosition = Position;

export interface BannerBackground {
  src: string;
  position: BackgroundPosition;
  zoom: number;
}

const CENTER: BackgroundPosition = { x: 50, y: 50 };

/** Where a background sits by default: its preset's focus, or the center. */
function defaultBackgroundPosition(src: string): BackgroundPosition {
  return presetBySrc(src)?.focus ?? CENTER;
}

/** Reads the background, its position and zoom from banner state; tolerates missing or bad values. */
export function backgroundFromState(state: Record<string, unknown>): BannerBackground | undefined {
  const src = state.backgroundImage;
  if (typeof src !== "string" || !src) return undefined;
  const position = positionOr(state.backgroundPosition, defaultBackgroundPosition(src));
  const zoom =
    typeof state.backgroundZoom === "number" && Number.isFinite(state.backgroundZoom)
      ? clamp(state.backgroundZoom, MIN_BACKGROUND_ZOOM, MAX_BACKGROUND_ZOOM)
      : MIN_BACKGROUND_ZOOM;
  return { src, position, zoom };
}

/** True when the background is at its default position and zoom, so there's nothing to reset. */
export function isDefaultBackgroundFraming({ src, position, zoom }: BannerBackground): boolean {
  return zoom === MIN_BACKGROUND_ZOOM && samePosition(position, defaultBackgroundPosition(src));
}

/**
 * Styles for the background `<img>`. `object-position` places the image; zoom scales it around the
 * same point, so 0% and 100% keep an edge aligned at any zoom and the frame never shows a gap.
 */
export function backgroundImageStyle({ position, zoom }: BannerBackground): CSSProperties {
  const point = `${position.x}% ${position.y}%`;
  return {
    objectPosition: point,
    ...(zoom > MIN_BACKGROUND_ZOOM && { transform: `scale(${zoom})`, transformOrigin: point }),
  };
}

/** How far (in banner pixels) the image can move on each axis when it covers `frame`. */
export function backgroundPanRange(frame: Box, image: Box, zoom: number): Box {
  const cover = Math.max(frame.width / image.width, frame.height / image.height) * zoom;
  return {
    width: Math.max(0, image.width * cover - frame.width),
    height: Math.max(0, image.height * cover - frame.height),
  };
}

/**
 * The position after dragging the image by `delta` banner pixels, rounded (roundPosition).
 * Dragging right shows more of the left side, which lowers `x`. Axes without room to move are left
 * as they are.
 */
export function dragBackgroundPosition(
  position: BackgroundPosition,
  delta: { x: number; y: number },
  range: Box,
): BackgroundPosition {
  const move = (value: number, by: number, room: number) =>
    room < 1 ? value : clampPercent(value - (by / room) * 100);
  return roundPosition({
    x: move(position.x, delta.x, range.width),
    y: move(position.y, delta.y, range.height),
  });
}

/**
 * The position after an arrow key: `step` percent on each axis, rounded (roundPosition). Like a
 * drag, the image moves the arrow's way: → shows more of the left side, which lowers `x`.
 */
export function nudgeBackgroundPosition(
  position: BackgroundPosition,
  step: { x: number; y: number },
): BackgroundPosition {
  return roundPosition({
    x: clampPercent(position.x - step.x),
    y: clampPercent(position.y - step.y),
  });
}
