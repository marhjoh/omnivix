/**
 * Scale that fits a banner of `content` size inside `available` space without upscaling.
 * The preview renders the banner at its real export size and applies this as a transform,
 * so the preview is an exact miniature of the exported PNG.
 */
export function fitScale(
  available: { width: number; height: number },
  content: { width: number; height: number },
): number {
  if (content.width <= 0 || content.height <= 0) return 1;
  const scale = Math.min(available.width / content.width, available.height / content.height, 1);
  return Math.max(scale, 0);
}
