import { isOneOf } from "@/src/lib/isOneOf";

/**
 * The Size control shared by all templates. In the GitHub, contribution and repos banners XL is the
 * largest size that fits the banner and each step down is 80% of the one above. The quote banner
 * maps the same options to fixed type sizes.
 */

export const CONTENT_SIZES = ["xs", "s", "m", "l", "xl"] as const;

export type ContentSize = (typeof CONTENT_SIZES)[number];

/** Contribution banner only: cells cover the whole banner and bleed past its edges. */
export const CONTENT_SIZES_OR_FILL = [...CONTENT_SIZES, "fill"] as const;

export type ContentSizeOrFill = (typeof CONTENT_SIZES_OR_FILL)[number];

export const DEFAULT_CONTENT_SIZE: ContentSize = "l";

/** Share of the largest size that fits (XL). */
export const CONTENT_SIZE_FACTOR: Record<ContentSize, number> = {
  xs: 0.8 ** 4,
  s: 0.8 ** 3,
  m: 0.8 ** 2,
  l: 0.8,
  xl: 1,
};

export const CONTENT_SIZE_OPTIONS = CONTENT_SIZES.map((value) => ({
  label: value.toUpperCase(),
  value,
}));

export function normalizeContentSize(
  raw: unknown,
  fallback: ContentSize = DEFAULT_CONTENT_SIZE,
): ContentSize {
  return isOneOf(CONTENT_SIZES, raw) ? raw : fallback;
}

export function normalizeContentSizeOrFill(raw: unknown): ContentSizeOrFill {
  return isOneOf(CONTENT_SIZES_OR_FILL, raw) ? raw : DEFAULT_CONTENT_SIZE;
}
