import type { ContentSize } from "@/src/banner/contentSize";
import { placedItem, type PlacedItem } from "@/src/banner/placement";
import { samePosition, type Position } from "@/src/banner/position";
import { SITE_LINKS } from "@/src/lib/site";
import { linkText } from "@/src/lib/text";
import type { BaseSettings } from "@/src/templates/stateSchemas";

/**
 * A small "made with Omnivix" mark on the banner. It's the only way an uploaded banner can point
 * back here, since no platform makes a banner clickable.
 */

export const CREDIT_STYLES = ["off", "logo", "icon", "text", "site", "repo", "badge"] as const;

export type CreditStyle = (typeof CREDIT_STYLES)[number];

/** What the text styles write on the banner. */
export const CREDIT_TEXT: Record<"text" | "site" | "repo", string> = {
  text: "Made with Omnivix",
  site: linkText(SITE_LINKS.site),
  repo: linkText(SITE_LINKS.repo),
};

export const CREDIT_STYLE_OPTIONS: Array<{ label: string; value: CreditStyle }> = [
  { label: "Off", value: "off" },
  { label: "Logo", value: "logo" },
  { label: "Icon", value: "icon" },
  { label: CREDIT_TEXT.text, value: "text" },
  { label: CREDIT_TEXT.site, value: "site" },
  { label: CREDIT_TEXT.repo, value: "repo" },
  { label: "Badge", value: "badge" },
];

export const DEFAULT_CREDIT_STYLE: CreditStyle = "off";

export const DEFAULT_CREDIT_SIZE: ContentSize = "s";

/** Bottom right, because the logo has the top right and LinkedIn and X cover the lower left. */
const DEFAULT_CREDIT_POSITION: Position = { x: 100, y: 100 };

/** The credit's height as a share of the safe area's height. */
const CREDIT_HEIGHT: Record<ContentSize, number> = {
  xs: 0.045,
  s: 0.06,
  m: 0.075,
  l: 0.095,
  xl: 0.12,
};

/** `height` is the artwork's height, or the text's font size. */
export interface BannerCredit extends PlacedItem {
  style: Exclude<CreditStyle, "off">;
}

function creditPositionFromState(state: BaseSettings): Position {
  return state.creditPosition ?? DEFAULT_CREDIT_POSITION;
}

/** True when the credit is at its default place, so there's nothing to reset. */
export function isDefaultCreditPosition(state: BaseSettings): boolean {
  return samePosition(creditPositionFromState(state), DEFAULT_CREDIT_POSITION);
}

/** The credit with its position and size, or undefined when it's off. */
export function creditFromState(state: BaseSettings): BannerCredit | undefined {
  if (state.credit === "off") return undefined;
  return {
    style: state.credit,
    ...placedItem(state.size, creditPositionFromState(state), CREDIT_HEIGHT[state.creditSize]),
  };
}
