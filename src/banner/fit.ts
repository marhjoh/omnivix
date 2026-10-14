/** Fit math for `FitContent`, kept free of the DOM so it can be unit tested. */

/** "pending" until `FitContent` has fitted its content with fonts loaded, then "ready". */
export const FIT_STATUS_ATTRIBUTE = "data-banner-fit";

interface Box {
  width: number;
  height: number;
}

/** Margin around the content on all sides, as a share of the banner height. */
const CONTENT_INSET_RATIO = 0.08;

export function contentBox(banner: Box): Box & { inset: number } {
  const inset = Math.round(banner.height * CONTENT_INSET_RATIO);
  return {
    inset,
    width: Math.max(0, banner.width - 2 * inset),
    height: Math.max(0, banner.height - 2 * inset),
  };
}

/** Largest scale at which content of the given natural size fits the box. */
export function fitScale(box: Box, natural: Box): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.min(box.width / natural.width, box.height / natural.height);
}
