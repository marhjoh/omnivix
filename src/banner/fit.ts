import {
  BANNER_SIZES,
  safeAreaOf,
  type BannerBox,
  type BannerSize,
  type Box,
  type Rect,
} from "@/src/lib/sizes";

/** Fit math for FitContent. It doesn't touch the DOM, so it can be unit tested. */

/** "pending" until `FitContent` has fitted its content with fonts loaded, then "ready". */
export const FIT_STATUS_ATTRIBUTE = "data-banner-fit";

/** Margin around the content on all sides, as a share of the safe area's height. */
const CONTENT_INSET_RATIO = 0.08;

/**
 * The padded box for the content and the logo. It's the format's safe area, or the whole banner,
 * less a margin, so every device shows it.
 */
export function contentBox(banner: BannerBox): Rect {
  const shown = safeAreaOf(banner);
  const inset = Math.round(shown.height * CONTENT_INSET_RATIO);
  return {
    left: shown.left + inset,
    top: shown.top + inset,
    width: Math.max(0, shown.width - 2 * inset),
    height: Math.max(0, shown.height - 2 * inset),
  };
}

/** `contentBox` for the format named in banner state's `size`. */
export function contentBoxOf(size: BannerSize): Rect {
  return contentBox(BANNER_SIZES[size]);
}

/** Largest scale at which content of the given natural size fits the box. */
export function fitScale(box: Box, natural: Box): number {
  if (natural.width <= 0 || natural.height <= 0) return 1;
  return Math.min(box.width / natural.width, box.height / natural.height);
}
