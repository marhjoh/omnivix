import type { CSSProperties } from "react";
import type { BannerUiChrome } from "@/src/theme/theme";

export const STAR_COLOR = "#f2cc60";
export const FORK_COLOR = "#b392f0";

/** The frame of the repos and stats banners' cards. Padding and layout are up to each card. */
export function cardStyle(chrome: BannerUiChrome): CSSProperties {
  return {
    border: `1px solid ${chrome.cardBorder}`,
    borderRadius: 10,
    background: chrome.cardBg,
    color: chrome.cardText,
    boxShadow: chrome.cardShadow,
    boxSizing: "border-box",
  };
}

/** A language's color, as GitHub shows it next to the name. */
export function LanguageDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}
