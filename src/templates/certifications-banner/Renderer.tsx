import { Award } from "lucide-react";
import { cardStyle } from "@/src/banner/card";
import { namedCertifications } from "@/src/banner/certifications";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import { brandIconColor, ICON_COLORS } from "@/src/banner/iconColor";
import { ELLIPSIS, lineClamp } from "@/src/banner/textStyle";
import { IconMark } from "@/src/icons/IconMark";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const BADGE_WIDTH_PX = 248;
const MEDALLION_PX = 40;
const ICON_PX = 22;
const GAP_PX = 8;

export function CertificationsBannerRenderer({
  state,
  data,
  uiTheme,
}: RendererProps<"certifications-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const certifications = namedCertifications(state.certifications);
  const icons = new Map(data.icons?.map((icon) => [icon.slug, icon]));
  const columns = Math.max(1, Math.min(Math.round(state.badgesPerRow), certifications.length));

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${BADGE_WIDTH_PX}px)`,
          gap: GAP_PX,
        }}
      >
        {certifications.map((certification, i) => {
          const icon = icons.get(certification.slug);
          // Issuers Simple Icons doesn't have, such as AWS, get an award in gold.
          const color = state.showIconColors
            ? icon
              ? brandIconColor(icon.hex, uiTheme)
              : ICON_COLORS.yellow
            : undefined;
          const details = [
            state.showIssuer && certification.issuer.trim(),
            state.showYear && certification.year,
          ].filter(Boolean);
          return (
            <div
              key={i}
              style={{
                ...cardStyle(chrome),
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: MEDALLION_PX,
                  height: MEDALLION_PX,
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: color
                    ? `color-mix(in srgb, ${color} 14%, transparent)`
                    : chrome.pillBg,
                }}
              >
                {icon ? (
                  <IconMark icon={icon} size={ICON_PX} color={color ?? chrome.cardText} />
                ) : (
                  <Award
                    size={ICON_PX}
                    strokeWidth={2}
                    aria-hidden
                    color={color ?? chrome.cardText}
                  />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    ...lineClamp(2),
                  }}
                >
                  {certification.name}
                </p>
                {details.length > 0 && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11.5,
                      lineHeight: 1.3,
                      color: chrome.cardTextMuted,
                      ...ELLIPSIS,
                    }}
                  >
                    {details.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FitContent>
  );
}
