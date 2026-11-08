import type { ReactNode } from "react";
import { Globe, Mail } from "lucide-react";
import { siGithub } from "simple-icons";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import { brandIconColor } from "@/src/banner/iconColor";
import { INTRO_LINKS, linkText, type IntroLinkKey } from "@/src/banner/intro";
import { lineClamp } from "@/src/banner/textStyle";
import { IconMark } from "@/src/icons/IconMark";
import { iconsInOrder } from "@/src/icons/iconSelection";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const SIZING = {
  photo: 96,
  name: 32,
  headline: 17,
  tagline: 14,
  /** A tagline wraps at this width, so a long one doesn't shrink the whole banner. */
  taglineWidth: 440,
  /** Enough for the longest tagline at this width. */
  taglineLines: 3,
  /** Links past this width wrap to a second row, so they don't shrink the whole banner. */
  linksWidth: 680,
  icon: 20,
  linkIcon: 14,
  link: 12,
};

const LINK_ICONS: Record<IntroLinkKey, ReactNode> = {
  github: <IconMark icon={siGithub} size={SIZING.linkIcon} />,
  linkedin: <PlatformIcon icon="linkedin" size={SIZING.linkIcon} />,
  x: <PlatformIcon icon="x" size={SIZING.linkIcon} />,
  website: <Globe size={SIZING.linkIcon} aria-hidden />,
  email: <Mail size={SIZING.linkIcon} aria-hidden />,
};

export function IntroBannerRenderer({ state, data, uiTheme }: RendererProps<"intro-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const headline = state.showHeadline ? state.headline.trim() : "";
  const tagline = state.tagline.trim();
  const icons = state.showIcons ? iconsInOrder(state.icons, data.icons) : [];
  const links = state.showLinks
    ? INTRO_LINKS.flatMap(({ key }) => {
        const text = linkText(state[key]);
        return text ? [{ key, text }] : [];
      })
    : [];

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {state.photoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.photoImage}
              alt=""
              style={{
                width: SIZING.photo,
                height: SIZING.photo,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: SIZING.name,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              {state.name}
            </p>
            {headline && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: SIZING.headline,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {headline}
              </p>
            )}
            {tagline && (
              <p
                style={{
                  margin: "8px 0 0",
                  maxWidth: SIZING.taglineWidth,
                  fontSize: SIZING.tagline,
                  lineHeight: 1.4,
                  color: chrome.textMuted,
                  wordBreak: "break-word",
                  ...lineClamp(SIZING.taglineLines),
                }}
              >
                {tagline}
              </p>
            )}
            {icons.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                {icons.map((icon) => (
                  <IconMark
                    key={icon.slug}
                    icon={icon}
                    size={SIZING.icon}
                    color={
                      (state.showIconColors && brandIconColor(icon.hex, uiTheme)) || chrome.text
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {links.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 18px",
              maxWidth: SIZING.linksWidth,
              paddingTop: 12,
              borderTop: `1px solid ${chrome.cardBorder}`,
              fontSize: SIZING.link,
              color: chrome.textMuted,
            }}
          >
            {links.map(({ key, text }) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {LINK_ICONS[key]}
                {text}
              </span>
            ))}
          </div>
        )}
      </div>
    </FitContent>
  );
}
