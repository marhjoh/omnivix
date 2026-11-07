import type { CSSProperties } from "react";
import { presetBySrc } from "@/src/backgrounds/presets";
import { clampPercent, roundPosition, samePosition, type Position } from "@/src/banner/position";
import type { Box } from "@/src/lib/sizes";
import type { BaseSettings } from "@/src/templates/stateSchemas";

export const MIN_BACKGROUND_ZOOM = 1;
export const MAX_BACKGROUND_ZOOM = 1.5;
/** In percent. The default keeps the content readable on most photos. */
export const DEFAULT_BACKGROUND_OPACITY = 28;

export interface BannerBackground {
  src: string;
  position: Position;
  zoom: number;
  opacity: number;
}

const CENTER: Position = { x: 50, y: 50 };

function defaultBackgroundPosition(src: string): Position {
  return presetBySrc(src)?.focus ?? CENTER;
}

/** The background image with its position, zoom and opacity, or undefined when there's none. */
export function backgroundFromState(state: BaseSettings): BannerBackground | undefined {
  const src = state.backgroundImage;
  if (!src) return undefined;
  return {
    src,
    position: state.backgroundPosition ?? defaultBackgroundPosition(src),
    zoom: state.backgroundZoom ?? MIN_BACKGROUND_ZOOM,
    opacity: state.backgroundOpacity ?? DEFAULT_BACKGROUND_OPACITY,
  };
}

/** True when the background hasn't been moved, so there's nothing to reset. */
export function isDefaultBackgroundPosition({ src, position }: BannerBackground): boolean {
  return samePosition(position, defaultBackgroundPosition(src));
}

/**
 * Styles for the background `<img>`. Zoom scales around the `object-position` point. That keeps an
 * edge aligned at 0% and 100%, so no gap shows at any zoom.
 */
export function backgroundImageStyle({ position, zoom, opacity }: BannerBackground): CSSProperties {
  const point = `${position.x}% ${position.y}%`;
  return {
    opacity: opacity / 100,
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
 * The position after dragging the image by `delta` banner pixels. Dragging right shows more of the
 * left side, which lowers `x`. An axis with no room to move stays put.
 */
export function dragBackgroundPosition(
  position: Position,
  delta: { x: number; y: number },
  range: Box,
): Position {
  const move = (value: number, by: number, room: number) =>
    room < 1 ? value : clampPercent(value - (by / room) * 100);
  return roundPosition({
    x: move(position.x, delta.x, range.width),
    y: move(position.y, delta.y, range.height),
  });
}

/**
 * The position after an arrow key, `step` percent per axis. As with a drag, the image moves the
 * arrow's way, so → lowers `x`.
 */
export function nudgeBackgroundPosition(
  position: Position,
  step: { x: number; y: number },
  range: Box,
): Position {
  const move = (value: number, by: number, room: number) =>
    room < 1 ? value : clampPercent(value - by);
  return roundPosition({
    x: move(position.x, step.x, range.width),
    y: move(position.y, step.y, range.height),
  });
}
