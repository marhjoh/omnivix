import type { CSSProperties } from "react";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { contentBoxOf } from "@/src/banner/fit";
import { BANNER_CONTENT_ATTRIBUTE, placementStyle } from "@/src/banner/placement";
import { normalizeContentSize, type ContentSize } from "@/src/banner/contentSize";
import {
  AUTHOR_GAP,
  AUTHOR_SCALE,
  LARGE_MARK_FONT_FAMILY,
  quoteStyleFromState,
  type QuoteMarks,
} from "@/src/banner/quoteStyle";
import { bannerUiChrome } from "@/src/theme/theme";
import { quoteBannerDefinition } from "@/src/templates/definitions";
import type { RendererProps } from "@/src/templates/renderers/types";

/** A quote longer than this is set smaller and may run to more lines. */
const LONG_QUOTE_CHARS = 120;
const LONG_QUOTE_SCALE = 0.7;
const MIN_QUOTE_PX = 24;
const QUOTE_LINES = { short: 3, long: 5 };

/** Fixed type sizes: the quote keeps its own scale rather than fitting to the banner. */
const QUOTE_SIZES: Record<ContentSize, number> = { xs: 28, s: 36, m: 48, l: 58, xl: 66 };

/**
 * The large marks, each a size (times the quote's font size) with the mark's own style and what it
 * needs of the quote's block. `fontSize` is the quote's.
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
  // In the room the block leaves above the text, behind it.
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

export function QuoteBannerRenderer({ state, uiTheme }: RendererProps) {
  const chrome = bannerUiChrome(uiTheme);
  const position = contentPositionFromState(state);
  const style = quoteStyleFromState(state, uiTheme);
  const quote = String(state.quote ?? "");
  const author = String(state.author ?? "");
  const { initialState } = quoteBannerDefinition;
  const quoteSize = QUOTE_SIZES[normalizeContentSize(state.contentSize, initialState.contentSize)];
  // In step with the quote's size setting, not with a long quote's smaller type.
  const authorFontSize = Math.round(
    quoteSize * AUTHOR_SCALE[normalizeContentSize(state.authorSize, initialState.authorSize)],
  );

  const longText = quote.length > LONG_QUOTE_CHARS;
  const quoteFontSize = longText
    ? Math.max(MIN_QUOTE_PX, Math.round(quoteSize * LONG_QUOTE_SCALE))
    : quoteSize;

  const [open, close] = style.textMarks ?? ["", ""];
  const quoteType: CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: quoteFontSize,
    lineHeight: 1.2,
    fontWeight: style.fontWeight,
  };
  const largeMark = LARGE_MARKS[style.marks];
  const mark = (glyph: string) =>
    glyph ? <span style={{ color: style.markColor }}>{glyph}</span> : null;

  return (
    <>
      {/* The padded box the quote moves in. It doesn't clip: large marks may reach into the
          padding, and the line limit keeps long quotes inside. */}
      <div
        style={{
          position: "absolute",
          ...contentBoxOf(state.size),
          fontSizeAdjust: String(style.xHeight),
        }}
      >
        {/* As wide as its longest line, so a short quote can move sideways. Placed with CSS, so
            it's right from the server render. Alignment and dragging only move it: the text,
            marks and author are always centered in it. */}
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
          {/* The text column. Positioned, so the text paints over Large behind's mark. */}
          <div style={{ position: "relative", minWidth: 0 }}>
            <blockquote
              style={{
                ...quoteType,
                fontStyle: style.fontStyle,
                letterSpacing: style.letterSpacing,
                color: style.color,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: longText ? QUOTE_LINES.long : QUOTE_LINES.short,
                WebkitBoxOrient: "vertical",
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {style.authorPrefix}
                {author}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
