import { backgroundFromState, DEFAULT_BACKGROUND_OPACITY } from "@/src/banner/background";
import type { ContentSize } from "@/src/banner/contentSize";
import { placedItem, type PlacedItem } from "@/src/banner/placement";
import { samePosition, type Position } from "@/src/banner/position";
import { SITE_LINKS } from "@/src/lib/site";
import { linkText } from "@/src/lib/text";
import { clamp } from "@/src/lib/math";
import type { BaseSettings } from "@/src/templates/stateSchemas";

/**
 * A small "made with Omnivix" mark on the banner. It's the only way an uploaded banner can point
 * back here, since no platform makes a banner clickable.
 */

/** "chip" sits in a frosted pill. "stacked" puts a small label above the mark. */
export const CREDIT_STYLES = ["none", "chip", "stacked"] as const;

export type CreditStyle = (typeof CREDIT_STYLES)[number];

export const CREDIT_STYLE_OPTIONS: Array<{ label: string; value: CreditStyle }> = [
  { label: "None", value: "none" },
  { label: "Chip", value: "chip" },
  { label: "Stacked", value: "stacked" },
];

/** What the credit shows after "made with". */
export const CREDIT_CONTENTS = ["logo", "site", "repo"] as const;

export type CreditContent = (typeof CREDIT_CONTENTS)[number];

export const CREDIT_CONTENT_OPTIONS: Array<{ label: string; value: CreditContent }> = [
  { label: "Logo", value: "logo" },
  { label: "Site", value: "site" },
  { label: "Repo", value: "repo" },
];

/** The text after the icon, for the site and the repo. */
export const CREDIT_TEXT: Record<Exclude<CreditContent, "logo">, string> = {
  site: linkText(SITE_LINKS.site),
  repo: new URL(SITE_LINKS.repo).pathname.slice(1),
};

export const DEFAULT_CREDIT_STYLE: CreditStyle = "none";

export const DEFAULT_CREDIT_CONTENT: CreditContent = "logo";

export const DEFAULT_CREDIT_SIZE: ContentSize = "s";

/** Bottom right, because the logo has the top right and LinkedIn and X cover the lower left. */
const DEFAULT_CREDIT_POSITION: Position = { x: 100, y: 100 };

/** The credit's font size as a share of the safe area's height. */
const CREDIT_HEIGHT: Record<ContentSize, number> = {
  xs: 0.04,
  s: 0.05,
  m: 0.06,
  l: 0.075,
  xl: 0.095,
};

/** `height` is the font size of the mark's text. */
export interface BannerCredit extends PlacedItem {
  style: Exclude<CreditStyle, "none">;
  content: CreditContent;
  /**
   * How strongly the stacked credit hazes the photo behind it, from 0 to 1. Photos at the default
   * opacity or less get none, because the banner's base color already shows through them.
   */
  haze: number;
}

function creditPositionFromState(state: BaseSettings): Position {
  return state.creditPosition ?? DEFAULT_CREDIT_POSITION;
}

/** True when the credit is at its default place, so there's nothing to reset. */
export function isDefaultCreditPosition(state: BaseSettings): boolean {
  return samePosition(creditPositionFromState(state), DEFAULT_CREDIT_POSITION);
}

function hazeOf(state: BaseSettings): number {
  const opacity = backgroundFromState(state)?.opacity ?? 0;
  return clamp((opacity - DEFAULT_BACKGROUND_OPACITY) / (100 - DEFAULT_BACKGROUND_OPACITY), 0, 1);
}

/** The credit with its position and size, or undefined when there's none. */
export function creditFromState(state: BaseSettings): BannerCredit | undefined {
  if (state.credit === "none") return undefined;
  return {
    style: state.credit,
    content: state.creditContent,
    haze: hazeOf(state),
    ...placedItem(state.size, creditPositionFromState(state), CREDIT_HEIGHT[state.creditSize]),
  };
}
