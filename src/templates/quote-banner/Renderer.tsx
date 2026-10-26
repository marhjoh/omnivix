import { Frame } from "@/src/banner/Frame";
import { logoFromState } from "@/src/banner/logo";
import { backgroundFromState } from "@/src/banner/background";
import { normalizeContentAlign } from "@/src/banner/contentAlign";
import { alignmentAt, contentPositionFromState } from "@/src/banner/contentPosition";
import { BANNER_CONTENT_ATTRIBUTE, contentBox } from "@/src/banner/fit";
import { placementStyle } from "@/src/banner/placement";
import { normalizeContentSize, type ContentSize } from "@/src/banner/contentSize";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { quoteBannerDefinition } from "@/src/templates/definitions";
import { RenderData } from "@/src/templates/renderers/types";
import { BANNER_SIZES, normalizeBannerSize } from "@/src/lib/sizes";

/** A quote longer than this is set smaller and may run to more lines. */
const LONG_QUOTE_CHARS = 120;
const LONG_QUOTE_SCALE = 0.7;
const MIN_QUOTE_PX = 24;
const QUOTE_LINES = { short: 3, long: 5 };

/** Fixed type sizes: the quote keeps its own scale rather than fitting to the banner. */
const QUOTE_SIZES: Record<ContentSize, { quote: number; author: number }> = {
  xs: { quote: 28, author: 14 },
  s: { quote: 36, author: 16 },
  m: { quote: 48, author: 20 },
  l: { quote: 58, author: 22 },
  xl: { quote: 66, author: 24 },
};

export function QuoteBannerRenderer({
  state,
  uiTheme,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const background = backgroundFromState(state);
  const position = contentPositionFromState(state);
  // Text at the left, the center or the right lines up that way, whatever `alignment` says.
  const alignment = alignmentAt(position.x) ?? normalizeContentAlign(state.alignment);
  const { inset } = contentBox(BANNER_SIZES[normalizeBannerSize(state.size)]);
  const quote = String(state.quote ?? "");
  const author = String(state.author ?? "");
  const quoteScale =
    QUOTE_SIZES[
      normalizeContentSize(state.contentSize, quoteBannerDefinition.initialState.contentSize)
    ];

  const longText = quote.length > LONG_QUOTE_CHARS;
  const quoteFontSize = longText
    ? Math.max(MIN_QUOTE_PX, Math.round(quoteScale.quote * LONG_QUOTE_SCALE))
    : quoteScale.quote;

  return (
    <Frame uiTheme={uiTheme} background={background} logo={logoFromState(state)}>
      {/* The padded box the quote moves in, like the other banners' content. */}
      <div style={{ position: "absolute", inset, overflow: "hidden" }}>
        {/* As wide as its longest line, at most the box, so a short quote can move sideways.
            Placed with CSS alone, so it's in place from the server render on. */}
        <div
          {...{ [BANNER_CONTENT_ATTRIBUTE]: "" }}
          style={{
            ...placementStyle(position),
            width: "max-content",
            maxWidth: "100%",
            textAlign: alignment,
          }}
        >
          <blockquote
            style={{
              fontSize: quoteFontSize,
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: longText ? QUOTE_LINES.long : QUOTE_LINES.short,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
          {author && (
            <p
              style={{
                marginTop: 16,
                fontSize: quoteScale.author,
                color: chrome.textMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              — {author}
            </p>
          )}
        </div>
      </div>
    </Frame>
  );
}
