import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LanguageDot } from "@/src/banner/card";
import type { BannerUiChrome } from "@/src/theme/theme";

// The stats and AI usage banners' cards.

/** GitHub's gray for languages without a color, used for "Other" too. */
const NO_SHARE_COLOR = "#8b949e";

/** A card's icon and muted label. */
export function CardLabel({
  icon: Icon,
  label,
  iconColor,
  chrome,
}: {
  icon: LucideIcon;
  label: string;
  /** Without one, the icon takes the label's muted color. */
  iconColor: string | undefined;
  chrome: BannerUiChrome;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        lineHeight: 1.2,
        color: chrome.cardTextMuted,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden color={iconColor} />
      {label}
    </div>
  );
}

export function StatTile({
  icon,
  label,
  value,
  unit,
  iconColor,
  chrome,
  style,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  iconColor: string | undefined;
  chrome: BannerUiChrome;
  style: CSSProperties;
}) {
  return (
    <div style={style}>
      <CardLabel icon={icon} label={label} iconColor={iconColor} chrome={chrome} />
      <p
        style={{
          margin: "5px 0 0",
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {value}
        {unit && (
          <span
            style={{ marginLeft: 4, fontSize: 12, fontWeight: 500, color: chrome.cardTextMuted }}
          >
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

export interface Share {
  name: string;
  /** Null shows gray. */
  color: string | null;
  /** Between 0 and 1. */
  share: number;
}

/** A bar split by share, with a legend of names and percentages below it. */
export function ShareBar({
  shares,
  chrome,
  style,
  children,
}: {
  shares: Share[];
  chrome: BannerUiChrome;
  style: CSSProperties;
  /** Goes above the bar, such as a CardLabel. */
  children?: ReactNode;
}) {
  return (
    <div style={style}>
      {children}
      <div
        style={{
          display: "flex",
          gap: 2,
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          marginTop: children ? 8 : 0,
        }}
      >
        {shares.map((share) => (
          <span
            key={share.name}
            style={{ flex: share.share, background: share.color ?? NO_SHARE_COLOR }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 12px",
          marginTop: 8,
          fontSize: 11,
          lineHeight: 1.35,
        }}
      >
        {shares.map((share) => (
          <span key={share.name} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <LanguageDot color={share.color ?? NO_SHARE_COLOR} />
            {share.name}
            <span style={{ color: chrome.cardTextMuted }}>{Math.round(share.share * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
