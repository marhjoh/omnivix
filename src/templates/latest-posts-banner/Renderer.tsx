import { Rss } from "lucide-react";
import { cardStyle } from "@/src/banner/card";
import { contentFit } from "@/src/banner/contentPosition";
import { FitContent } from "@/src/banner/FitContent";
import { ICON_COLORS } from "@/src/banner/iconColor";
import { lineClamp } from "@/src/banner/textStyle";
import { formatDay } from "@/src/lib/dateRange";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** Sizes before FitContent scales them. */
const CARD_WIDTH_PX = 264;
const GAP_PX = 8;
const MAX_COLUMNS = 3;

export function LatestPostsBannerRenderer({
  state,
  data,
  uiTheme,
}: RendererProps<"latest-posts-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const posts = data.feed?.posts.slice(0, Math.round(state.postCount)) ?? [];
  const columns = Math.max(1, Math.min(posts.length, MAX_COLUMNS));

  return (
    <FitContent {...contentFit(state)} size={state.contentSize}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${CARD_WIDTH_PX}px)`,
          gap: GAP_PX,
        }}
      >
        {posts.map((post, i) => (
          <div
            key={i}
            style={{
              ...cardStyle(chrome),
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                lineHeight: 1.2,
                color: chrome.cardTextMuted,
              }}
            >
              <Rss size={12} strokeWidth={2.25} aria-hidden color={ICON_COLORS.orange} />
              {state.showDates && post.date && formatDay(post.date)}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.3,
                ...lineClamp(3),
              }}
            >
              {post.title}
            </p>
          </div>
        ))}
      </div>
    </FitContent>
  );
}
