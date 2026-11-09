import type { ContentSize } from "@/src/banner/contentSize";
import { placedItem, type PlacedItem } from "@/src/banner/placement";
import { samePosition, type Position } from "@/src/banner/position";
import type { BaseSettings } from "@/src/templates/stateSchemas";

export const DEFAULT_LOGO_SIZE: ContentSize = "m";

/** Top right, because LinkedIn and X cover the lower left with the profile photo. */
const DEFAULT_LOGO_POSITION: Position = { x: 100, y: 0 };

/** The logo's height as a share of the safe area's height. */
const LOGO_HEIGHT: Record<ContentSize, number> = {
  xs: 0.08,
  s: 0.11,
  m: 0.15,
  l: 0.2,
  xl: 0.26,
};

export interface BannerLogo extends PlacedItem {
  src: string;
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
    ...placedItem(state.size, logoPositionFromState(state), LOGO_HEIGHT[state.logoSize]),
  };
}
