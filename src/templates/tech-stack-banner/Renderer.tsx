import type { CSSProperties } from "react";
import { cardStyle } from "@/src/banner/card";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import { brandIconColor } from "@/src/banner/iconColor";
import { ELLIPSIS } from "@/src/banner/textStyle";
import { IconMark } from "@/src/icons/IconMark";
import { iconsInOrder } from "@/src/icons/iconSelection";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const TILE = {
  labeled: { width: 96, padding: "12px 8px 10px", icon: 30 },
  plain: { width: 56, padding: "13px", icon: 30 },
};
const GAP_PX = 8;

export function TechStackBannerRenderer({
  state,
  data,
  uiTheme,
}: RendererProps<"tech-stack-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const icons = iconsInOrder(state.icons, data.icons);
  const tile = state.showLabels ? TILE.labeled : TILE.plain;
  const columns = Math.max(1, Math.min(Math.round(state.iconsPerRow), icons.length));
  const style: CSSProperties = {
    ...cardStyle(chrome),
    width: tile.width,
    padding: tile.padding,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${tile.width}px)`,
          gap: GAP_PX,
        }}
      >
        {icons.map((icon) => (
          <div key={icon.slug} style={style}>
            <IconMark
              icon={icon}
              size={tile.icon}
              color={(state.showIconColors && brandIconColor(icon.hex, uiTheme)) || chrome.cardText}
            />
            {state.showLabels && (
              <p
                style={{
                  margin: "8px 0 0",
                  maxWidth: "100%",
                  fontSize: 11,
                  lineHeight: 1.25,
                  fontWeight: 500,
                  ...ELLIPSIS,
                }}
              >
                {icon.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </FitContent>
  );
}
