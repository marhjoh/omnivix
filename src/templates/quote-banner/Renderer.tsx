import type { CSSProperties } from "react";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { contentBoxOf } from "@/src/banner/fit";
import { BANNER_CONTENT_ATTRIBUTE, placementStyle } from "@/src/banner/placement";
import type { ContentSize } from "@/src/banner/contentSize";
import {
  LARGE_MARK_FONT_FAMILY,
  quoteStyleFromState,
  type QuoteMarks,
} from "@/src/banner/quoteStyle";
import { ELLIPSIS, lineClamp } from "@/src/banner/textStyle";
import { bannerUiChrome } from "@/src/theme/theme";
import type { RendererProps } from "@/src/templates/types";

/** A quote longer than this is set smaller and may run to more lines. */
const LONG_QUOTE_CHARS = 120;
const LONG_QUOTE_SCALE = 0.7;
const MIN_QUOTE_PX = 24;
const QUOTE_LINES = { short: 3, long: 5 };

/** Fixed type sizes. Unlike the other templates, the quote isn't scaled to fit the banner. */
const QUOTE_SIZES: Record<ContentSize, number> = { xs: 28, s: 36, m: 48, l: 58, xl: 66 };

/** The author's size as a share of the quote's, so the two keep in proportion. */
const AUTHOR_SCALE: Record<ContentSize, number> = { xs: 0.3, s: 0.35, m: 0.42, l: 0.5, xl: 0.6 };

/** Space above the author, in banner pixels. */
const AUTHOR_GAP = 16;

/**
 * Styles for the large marks. `scale` is relative to the quote's font size, and `block` adds what
 * the mark needs from the quote's block. `fontSize` is the quote's.
 */
const LARGE_MARKS: Partial<
  Record<
    QuoteMarks,
    {
      scale: number;
      mark: (fontSize: number) => CSSProperties;
      block?: (fontSize: number) => CSSProperties;
    }
  >
> = {
  // Its line box is cut to the mark's height, so it sits just above the first line.
  "large-above": {
    scale: 2.4,
    mark: (fontSize) => ({ display: "block", height: fontSize * 1.15 }),
  },
  // Sits behind the text, in the padding the block adds above it.
  "large-behind": {
    scale: 6,
    mark: (fontSize) => ({
      position: "absolute",
      top: -fontSize * 0.5,
      left: -fontSize * 0.5,
      opacity: 0.14,
    }),
    block: (fontSize) => ({ paddingTop: fontSize * 0.8 }),
  },
  "large-beside": {
    scale: 3.2,
    mark: (fontSize) => ({ marginTop: -fontSize * 0.3, marginRight: fontSize * 0.45 }),
    block: () => ({ display: "flex", alignItems: "flex-start" }),
  },
};

export function QuoteBannerRenderer({ state, uiTheme }: RendererProps<"quote-banner">) {
  const chrome = bannerUiChrome(uiTheme);
  const position = contentPositionFromState(state);
  const style = quoteStyleFromState(state, uiTheme);
  const { quote, author } = state;
  const quoteSize = QUOTE_SIZES[state.contentSize];
  // Follows the quote size setting, not the smaller type of a long quote.
  const authorFontSize = Math.round(quoteSize * AUTHOR_SCALE[state.authorSize]);

  const longText = quote.length > LONG_QUOTE_CHARS;
  const quoteFontSize = longText
    ? Math.max(MIN_QUOTE_PX, Math.round(quoteSize * LONG_QUOTE_SCALE))
    : quoteSize;

  const [open, close] = style.textMarks ?? ["", ""];
  const largeMark = LARGE_MARKS[style.marks];
  const mark = (glyph: string) =>
    glyph ? <span style={{ color: style.markColor }}>{glyph}</span> : null;

  return (
    // The padded box the quote moves in. It doesn't clip, because large marks may reach into the
    // padding. The line limit keeps long quotes inside.
    <div
      style={{
        position: "absolute",
        ...contentBoxOf(state.size),
        fontSizeAdjust: String(style.xHeight),
      }}
    >
      {/* As wide as its longest line, so a short quote has room to move sideways. Plain CSS
          places it, so the server render is already right. Alignment and dragging move this box.
          The text inside always stays centered. */}
      <div
        {...{ [BANNER_CONTENT_ATTRIBUTE]: "" }}
        style={{
          ...placementStyle(position),
          width: "max-content",
          maxWidth: "100%",
          textAlign: "center",
          ...largeMark?.block?.(quoteFontSize),
          ...(style.marks === "bar" && {
            borderLeft: `${Math.max(3, Math.round(quoteFontSize * 0.1))}px solid ${style.markColor ?? chrome.text}`,
            paddingLeft: quoteFontSize * 0.65,
          }),
        }}
      >
        {largeMark && (
          <span
            aria-hidden
            style={{
              fontFamily: LARGE_MARK_FONT_FAMILY,
              fontSize: quoteFontSize * largeMark.scale,
              fontWeight: 700,
              lineHeight: 1,
              color: style.markColor,
              ...largeMark.mark(quoteFontSize),
            }}
          >
            &ldquo;
          </span>
        )}
        {/* position: relative makes the text paint over the Large behind mark. */}
        <div style={{ position: "relative", minWidth: 0 }}>
          <blockquote
            style={{
              fontFamily: style.fontFamily,
              fontSize: quoteFontSize,
              lineHeight: 1.2,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              letterSpacing: style.letterSpacing,
              color: style.color,
              ...lineClamp(longText ? QUOTE_LINES.long : QUOTE_LINES.short),
              wordBreak: "break-word",
            }}
          >
            {mark(open)}
            {quote}
            {mark(close)}
          </blockquote>
          {author && (
            // In the quote's block, so it moves with the quote.
            <p
              style={{
                marginTop: AUTHOR_GAP,
                fontFamily: style.authorFontFamily,
                fontSize: authorFontSize,
                color: style.authorColor ?? chrome.textMuted,
                ...ELLIPSIS,
              }}
            >
              {style.authorPrefix}
              {author}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
