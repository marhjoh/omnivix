import { bannerFormatOf, viewRect, type BannerBox, type Box, type Rect } from "@/src/lib/sizes";

/** Fit math for `FitContent`, kept free of the DOM so it can be unit tested. */

/** "pending" until `FitContent` has fitted its content with fonts loaded, then "ready". */
export const FIT_STATUS_ATTRIBUTE = "data-banner-fit";

/** Margin around the content on all sides, as a share of the height every device shows. */
const CONTENT_INSET_RATIO = 0.08;

/**
 * The padded box the content and the logo are placed in: the part every device shows (the whole
 * banner, or a format's phone view), less a margin.
 */
export function contentBox(banner: BannerBox): Rect {
  const shown = viewRect(banner, "phone");
  const inset = Math.round(shown.height * CONTENT_INSET_RATIO);
  return {
    left: shown.left + inset,
    top: shown.top + inset,
    width: Math.max(0, shown.width - 2 * inset),
    height: Math.max(0, shown.height - 2 * inset),
  };
}

/** The padded box of the banner format in banner state's `size`. */
export function contentBoxOf(size: unknown): Rect {
  return contentBox(bannerFormatOf(size));
}

/** Largest scale at which content of the given natural size fits the box. */
export function fitScale(box: Box, natural: Box): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.min(box.width / natural.width, box.height / natural.height);
}
