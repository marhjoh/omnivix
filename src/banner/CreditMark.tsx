import type { CSSProperties } from "react";
import { CREDIT_TEXT, type BannerCredit, type CreditContent } from "@/src/banner/credit";
import { brandSrc, BRAND_LOGO_SIZE } from "@/src/lib/site";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";

/**
 * The brand files' size and the part the artwork covers, in SVG units. The files have padding
 * around the artwork, which is cropped so the credit sits flush in its corner.
 */
const BRAND_ART = {
  logo: { ...BRAND_LOGO_SIZE, crop: { left: 51, top: 51, width: 865, height: 171 } },
  icon: { width: 207, height: 207, crop: { left: 17, top: 17, width: 171, height: 171 } },
} as const;

/** The GitHub mark, from Simple Icons: https://simpleicons.org/?q=github */
const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

/** The logo or icon file, cropped to its artwork and `height` tall. */
function BrandArt({
  name,
  height,
  uiTheme,
}: {
  name: "logo" | "icon";
  height: number;
  uiTheme: Theme;
}) {
  const { width, crop } = BRAND_ART[name];
  const scale = height / crop.height;
  return (
    <span style={{ flex: "none", width: crop.width * scale, height, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandSrc(name, uiTheme)}
        alt=""
        style={{
          display: "block",
          width: width * scale,
          maxWidth: "none",
          height: "auto",
          marginLeft: -crop.left * scale,
          marginTop: -crop.top * scale,
        }}
      />
    </span>
  );
}

/** What follows "made with": the logo, or an icon with the site or the repo. */
function Mark({
  content,
  size,
  uiTheme,
}: {
  content: CreditContent;
  size: number;
  uiTheme: Theme;
}) {
  if (content === "logo") return <BrandArt name="logo" height={size} uiTheme={uiTheme} />;
  return (
    <>
      {content === "site" ? (
        <BrandArt name="icon" height={size * 1.15} uiTheme={uiTheme} />
      ) : (
        <svg viewBox="0 0 24 24" width={size * 1.1} height={size * 1.1} fill="currentColor">
          <path d={GITHUB_PATH} />
        </svg>
      )}
      <span>{CREDIT_TEXT[content]}</span>
    </>
  );
}

/** The credit, in the banner's theme. Its text is `credit.height` tall. */
export function CreditMark({ credit, uiTheme }: { credit: BannerCredit; uiTheme: Theme }) {
  const { style, content, height: size, haze } = credit;
  const chrome = bannerUiChrome(uiTheme);
  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: size * 0.45,
    fontSize: size,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  // The cards' muted color is a little brighter than the banner's, so the small label reads.
  const label = <span style={{ color: chrome.cardTextMuted }}>made with</span>;
  const mark = <Mark content={content} size={size} uiTheme={uiTheme} />;

  if (style === "chip") {
    return (
      <div
        style={{
          ...row,
          padding: `${size * 0.5}px ${size * 0.8}px`,
          borderRadius: size * 2,
          background: chrome.cardBg,
          border: `1px solid ${chrome.cardBorder}`,
          backdropFilter: "blur(8px)",
          color: chrome.cardText,
        }}
      >
        {label}
        {mark}
      </div>
    );
  }
  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: size * 0.35,
        lineHeight: 1,
      }}
    >
      {haze > 0 && (
        // A soft patch of the base color, so the credit reads on a strong photo.
        <span
          style={{
            position: "absolute",
            inset: `${-size * 1.2}px ${-size * 2.2}px`,
            zIndex: -1,
            opacity: haze,
            background: `radial-gradient(ellipse closest-side, color-mix(in srgb, ${chrome.baseBg} 90%, transparent) 55%, transparent)`,
            filter: "blur(4px)",
          }}
        />
      )}
      <span style={{ fontSize: size * 0.7 }}>{label}</span>
      <div style={row}>{mark}</div>
    </div>
  );
}
