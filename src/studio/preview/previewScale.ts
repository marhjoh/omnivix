import { fitScale } from "@/src/banner/fit";
import { clamp } from "@/src/lib/math";

/**
 * Scale that fits a banner of `content` size inside `available` space without upscaling.
 * The preview renders the banner at its real export size and applies this as a transform,
 * so the preview is an exact miniature of the exported image.
 */
export function previewScale(
  available: { width: number; height: number },
  content: { width: number; height: number },
): number {
  return clamp(fitScale(available, content), 0, 1);
}

/**
 * The same fit as previewScale, as a CSS width. Only works inside the preview stage, which is a
 * size container. Used until the stage is measured, so the first paint is right.
 */
export function cssFitWidth(content: { width: number; height: number }): string {
  return `min(100cqw, 100cqh * ${content.width / content.height}, ${content.width}px)`;
}
