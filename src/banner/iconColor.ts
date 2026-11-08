import type { Theme } from "@/src/theme/theme";
import { FORK_COLOR, STAR_COLOR } from "@/src/banner/card";

/** The stats cards' icon colors: the repos banner's star and fork colors, and a few more in the same tone. */
export const ICON_COLORS = {
  blue: "#58a6ff",
  yellow: STAR_COLOR,
  purple: FORK_COLOR,
  green: "#3fb950",
  orange: "#ff7b45",
};

export type IconColor = keyof typeof ICON_COLORS;

/** The cards' fill in each theme (bannerUiChrome's cardBg without its slight transparency). */
const CARD_FILL: Record<Theme, string> = { light: "ffffff", dark: "151c28" };

/** Below this contrast with the card, a brand color is hard to see. */
const MIN_CONTRAST = 1.6;

/** WCAG relative luminance of a six-digit hex color. */
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * A brand's color for its icon on a card, or undefined when it's too close to the card's fill to
 * see, like a black logo in dark mode. Then the icon takes the text color.
 */
export function brandIconColor(hex: string, uiTheme: Theme): string | undefined {
  return contrast(hex, CARD_FILL[uiTheme]) >= MIN_CONTRAST ? `#${hex}` : undefined;
}
