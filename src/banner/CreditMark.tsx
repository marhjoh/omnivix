import type { CSSProperties } from "react";
import { CREDIT_TEXT, type BannerCredit } from "@/src/banner/credit";
import { brandSrc, BRAND_LOGO_SIZE } from "@/src/lib/site";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";

/** The brand's navy, from public/brand/*-dark.svg. */
const BRAND_NAVY = "#040A1C";

/**
 * The brand files' size and the part the artwork covers, in SVG units. The files have padding
 * around the artwork, which is cropped so the credit sits flush in its corner.
 */
const BRAND_ART = {
  logo: { ...BRAND_LOGO_SIZE, crop: { left: 51, top: 51, width: 865, height: 171 } },
  icon: { width: 207, height: 207, crop: { left: 17, top: 17, width: 171, height: 171 } },
} as const;

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
    <div style={{ width: crop.width * scale, height, overflow: "hidden" }}>
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
    </div>
  );
}

/** A "made with | omnivix" pill, like a README badge. */
function Badge({ height, uiTheme }: { height: number; uiTheme: Theme }) {
  const chrome = bannerUiChrome(uiTheme);
  const segment: CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: `0 ${height * 0.45}px`,
  };
  return (
    <div
      style={{
        display: "flex",
        boxSizing: "border-box",
        height: height * 1.25,
        border: `1px solid ${chrome.cardBorder}`,
        borderRadius: height,
        overflow: "hidden",
        fontSize: height * 0.7,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <span style={{ ...segment, background: chrome.cardBg, color: chrome.cardTextMuted }}>
        made with
      </span>
      <span
        style={{
          ...segment,
          background: uiTheme === "dark" ? "#ffffff" : BRAND_NAVY,
          color: uiTheme === "dark" ? BRAND_NAVY : "#ffffff",
        }}
      >
        omnivix
      </span>
    </div>
  );
}

/** The credit's artwork or text, in the banner's theme. */
export function CreditMark({ credit, uiTheme }: { credit: BannerCredit; uiTheme: Theme }) {
  const { style, height } = credit;
  if (style === "logo" || style === "icon") {
    return <BrandArt name={style} height={height} uiTheme={uiTheme} />;
  }
  if (style === "badge") return <Badge height={height} uiTheme={uiTheme} />;
  return (
    <span
      style={{
        display: "block",
        fontSize: height,
        fontWeight: 500,
        lineHeight: 1,
        color: bannerUiChrome(uiTheme).textMuted,
      }}
    >
      {CREDIT_TEXT[style]}
    </span>
  );
}
