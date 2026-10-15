import type { CSSProperties } from "react";
import { presetBySrc } from "@/src/backgrounds/presets";

export const MIN_BACKGROUND_ZOOM = 1;
export const MAX_BACKGROUND_ZOOM = 1.5;

/** A point in percent, as in CSS `object-position`: 0 is the left/top edge, 100 the right/bottom. */
export interface BackgroundPosition {
  x: number;
  y: number;
}

export interface BannerBackground {
  src: string;
  position: BackgroundPosition;
  zoom: number;
}

const CENTER: BackgroundPosition = { x: 50, y: 50 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function isPosition(raw: unknown): raw is BackgroundPosition {
  return (
    typeof raw === "object" &&
    raw !== null &&
    Number.isFinite((raw as BackgroundPosition).x) &&
    Number.isFinite((raw as BackgroundPosition).y)
  );
}

/** Where a background sits by default: its preset's focus, or the center. */
export function defaultBackgroundPosition(src: string): BackgroundPosition {
  return presetBySrc(src)?.focus ?? CENTER;
}

/** Reads the background, its position and zoom from banner state; tolerates missing or bad values. */
export function backgroundFromState(state: Record<string, unknown>): BannerBackground | undefined {
  const src = state.backgroundImage;
  if (typeof src !== "string" || !src) return undefined;
  const raw = state.backgroundPosition;
  const position = isPosition(raw)
    ? { x: clamp(raw.x, 0, 100), y: clamp(raw.y, 0, 100) }
    : defaultBackgroundPosition(src);
  const zoom =
    typeof state.backgroundZoom === "number" && Number.isFinite(state.backgroundZoom)
      ? clamp(state.backgroundZoom, MIN_BACKGROUND_ZOOM, MAX_BACKGROUND_ZOOM)
      : MIN_BACKGROUND_ZOOM;
  return { src, position, zoom };
}

/** True when the background is at its default position and zoom, so there's nothing to reset. */
export function isDefaultBackgroundFraming({ src, position, zoom }: BannerBackground): boolean {
  const initial = defaultBackgroundPosition(src);
  return zoom === MIN_BACKGROUND_ZOOM && position.x === initial.x && position.y === initial.y;
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

interface Size {
  width: number;
  height: number;
}

/** How far (in banner pixels) the image can move on each axis when it covers `frame`. */
export function backgroundPanRange(frame: Size, image: Size, zoom: number): Size {
  const cover = Math.max(frame.width / image.width, frame.height / image.height) * zoom;
  return {
    width: Math.max(0, image.width * cover - frame.width),
    height: Math.max(0, image.height * cover - frame.height),
  };
}

/**
 * The position after dragging the image by `delta` banner pixels. Dragging right shows more of the
 * left side, which lowers `x`. Axes without room to move are left as they are.
 */
export function dragBackgroundPosition(
  position: BackgroundPosition,
  delta: { x: number; y: number },
  range: Size,
): BackgroundPosition {
  const move = (value: number, by: number, room: number) =>
    room < 1 ? value : clamp(value - (by / room) * 100, 0, 100);
  return { x: move(position.x, delta.x, range.width), y: move(position.y, delta.y, range.height) };
}
