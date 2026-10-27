import { normalizeContentSize, type ContentSize } from "@/src/banner/contentSize";
import { contentBoxOf } from "@/src/banner/fit";
import { positionOr, type Position } from "@/src/banner/position";
import { BANNER_SIZES, normalizeBannerSize } from "@/src/lib/sizes";

export const DEFAULT_LOGO_SIZE: ContentSize = "m";

/** Top right: LinkedIn and X cover the lower left with the profile photo. */
const DEFAULT_LOGO_POSITION: Position = { x: 100, y: 0 };

/** The logo's height as a share of the banner height, so it looks the same in every format. */
const LOGO_HEIGHT: Record<ContentSize, number> = {
  xs: 0.08,
  s: 0.11,
  m: 0.15,
  l: 0.2,
  xl: 0.26,
};

export interface BannerLogo {
  src: string;
  /** In the padded box, as a placement (see `placement.ts`). */
  position: Position;
  /** In banner pixels. */
  height: number;
  /** The banner's padding, in banner pixels. */
  inset: number;
}

/** The logo's position from banner state: a moved one, or the top right. */
export function logoPositionFromState(state: Record<string, unknown>): Position {
  return positionOr(state.logoPosition, DEFAULT_LOGO_POSITION);
}

/** True when the logo is at its default place, so there's nothing to reset. */
export function isDefaultLogoPosition(state: Record<string, unknown>): boolean {
  const { x, y } = logoPositionFromState(state);
  return x === DEFAULT_LOGO_POSITION.x && y === DEFAULT_LOGO_POSITION.y;
}

/** Reads the logo, its place and size from banner state; tolerates missing or bad values. */
export function logoFromState(state: Record<string, unknown>): BannerLogo | undefined {
  const src = state.logoImage;
  if (typeof src !== "string" || !src) return undefined;
  const size = normalizeContentSize(state.logoSize, DEFAULT_LOGO_SIZE);
  return {
    src,
    position: logoPositionFromState(state),
    height: Math.round(BANNER_SIZES[normalizeBannerSize(state.size)].height * LOGO_HEIGHT[size]),
    inset: contentBoxOf(state.size).inset,
  };
}
