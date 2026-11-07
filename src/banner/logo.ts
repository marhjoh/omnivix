import type { ContentSize } from "@/src/banner/contentSize";
import { contentBoxOf } from "@/src/banner/fit";
import { samePosition, type Position } from "@/src/banner/position";
import { BANNER_SIZES, safeAreaOf, type Rect } from "@/src/lib/sizes";
import type { BaseSettings } from "@/src/templates/stateSchemas";

export const DEFAULT_LOGO_SIZE: ContentSize = "m";

/** Top right, because LinkedIn and X cover the lower left with the profile photo. */
const DEFAULT_LOGO_POSITION: Position = { x: 100, y: 0 };

/** The logo's height as a share of the safe area's height, so it looks the same in every format. */
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
  /** The padded box it moves in (`contentBox`), in banner pixels. */
  box: Rect;
}

export function logoPositionFromState(state: BaseSettings): Position {
  return state.logoPosition ?? DEFAULT_LOGO_POSITION;
}

/** True when the logo is at its default place, so there's nothing to reset. */
export function isDefaultLogoPosition(state: BaseSettings): boolean {
  return samePosition(logoPositionFromState(state), DEFAULT_LOGO_POSITION);
}

/** The logo with its position and size, or undefined when there's none. */
export function logoFromState(state: BaseSettings): BannerLogo | undefined {
  const src = state.logoImage;
  if (!src) return undefined;
  return {
    src,
    position: logoPositionFromState(state),
    height: Math.round(safeAreaOf(BANNER_SIZES[state.size]).height * LOGO_HEIGHT[state.logoSize]),
    box: contentBoxOf(state.size),
  };
}
