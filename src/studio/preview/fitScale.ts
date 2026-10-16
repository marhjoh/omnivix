import { fitScale as contentFitScale } from "@/src/banner/fit";

/**
 * Scale that fits a banner of `content` size inside `available` space without upscaling.
 * The preview renders the banner at its real export size and applies this as a transform,
 * so the preview is an exact miniature of the exported PNG.
 */
export function fitScale(
  available: { width: number; height: number },
  content: { width: number; height: number },
): number {
  return Math.max(Math.min(contentFitScale(available, content), 1), 0);
}

/**
 * fitScale's fit as CSS: the banner's width in the preview, for an element inside the preview
 * stage (a size container). Used until the stage is measured, so the first paint is right.
 */
export function cssFitWidth(content: { width: number; height: number }): string {
  return `min(100cqw, 100cqh * ${content.width / content.height}, ${content.width}px)`;
}
