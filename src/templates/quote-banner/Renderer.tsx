import type { CSSProperties } from "react";
import { Frame } from "@/src/banner/Frame";
import { logoFromState } from "@/src/banner/logo";
import { backgroundFromState } from "@/src/banner/background";
import { authorPositionFromState } from "@/src/banner/authorPosition";
import { normalizeContentAlign } from "@/src/banner/contentAlign";
import { ALIGN_X, alignmentAt, contentPositionFromState } from "@/src/banner/contentPosition";
import { contentBoxOf } from "@/src/banner/fit";
import {
  BANNER_AUTHOR_ATTRIBUTE,
  BANNER_CONTENT_ATTRIBUTE,
  placementStyle,
} from "@/src/banner/placement";
import { normalizeContentSize, type ContentSize } from "@/src/banner/contentSize";
import {
  AUTHOR_GAP,
  AUTHOR_SCALE,
  LARGE_MARK_FONT_FAMILY,
  quoteStyleFromState,
} from "@/src/banner/quoteStyle";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { quoteBannerDefinition } from "@/src/templates/definitions";
import { RenderData } from "@/src/templates/renderers/types";

/** A quote longer than this is set smaller and may run to more lines. */
const LONG_QUOTE_CHARS = 120;
const LONG_QUOTE_SCALE = 0.7;
const MIN_QUOTE_PX = 24;
const QUOTE_LINES = { short: 3, long: 5 };

/** Fixed type sizes: the quote keeps its own scale rather than fitting to the banner. */
const QUOTE_SIZES: Record<ContentSize, number> = { xs: 28, s: 36, m: 48, l: 58, xl: 66 };

export function QuoteBannerRenderer({
  state,
  uiTheme,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const position = contentPositionFromState(state);
  // Text at the left, the center or the right lines up that way, whatever `alignment` says.
  const alignment = alignmentAt(position.x) ?? normalizeContentAlign(state.alignment);
  const style = quoteStyleFromState(state, uiTheme);
  const quote = String(state.quote ?? "");
  const author = String(state.author ?? "");
  const { initialState } = quoteBannerDefinition;
  const quoteSize = QUOTE_SIZES[normalizeContentSize(state.contentSize, initialState.contentSize)];
  // In step with the quote's size setting, not with a long quote's smaller type.
  const authorFontSize = Math.round(
    quoteSize * AUTHOR_SCALE[normalizeContentSize(state.authorSize, initialState.authorSize)],
  );
  // Lined up like the quote until it's dragged.
  const authorAt = authorPositionFromState(state) ?? { x: ALIGN_X[alignment], y: 0 };

  const longText = quote.length > LONG_QUOTE_CHARS;
  const quoteFontSize = longText
    ? Math.max(MIN_QUOTE_PX, Math.round(quoteSize * LONG_QUOTE_SCALE))
    : quoteSize;

  const [open, close] = style.textMarks ?? ["", ""];
  // Left-aligned, the opening mark hangs in a column of its own, like Large beside's mark, so
  // the lines and the author start together.
  const hanging = Boolean(open) && alignment === "left";
  const quoteType: CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: quoteFontSize,
    lineHeight: 1.2,
    fontWeight: style.fontWeight,
  };
  const largeMark = (size: number): CSSProperties => ({
    fontFamily: LARGE_MARK_FONT_FAMILY,
    fontSize: quoteFontSize * size,
    fontWeight: 700,
    lineHeight: 1,
    color: style.markColor,
  });
  const mark = (glyph: string) =>
    glyph ? <span style={{ color: style.markColor }}>{glyph}</span> : null;

  return (
    <Frame uiTheme={uiTheme} background={backgroundFromState(state)} logo={logoFromState(state)}>
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
            it's right from the server render. */}
        <div
          {...{ [BANNER_CONTENT_ATTRIBUTE]: "" }}
          style={{
            ...placementStyle(position),
            width: "max-content",
            maxWidth: "100%",
            textAlign: alignment,
            ...((hanging || style.marks === "large-beside") && {
              display: "flex",
              alignItems: "flex-start",
            }),
            ...(style.marks === "bar" && {
              borderLeft: `${Math.max(3, Math.round(quoteFontSize * 0.1))}px solid ${style.markColor ?? chrome.text}`,
              paddingLeft: quoteFontSize * 0.65,
            }),
          }}
        >
          {style.marks === "large-above" && (
            // Its line box is cut to the mark's height, so it sits just above the first line.
            <span
              aria-hidden
              style={{ ...largeMark(2.4), display: "block", height: quoteFontSize * 1.15 }}
            >
              &ldquo;
            </span>
          )}
          {style.marks === "large-behind" && (
            <span
              aria-hidden
              style={{
                ...largeMark(6),
                position: "absolute",
                // Within the banner's padding when the quote is at the left edge.
                top: -quoteFontSize * 1.3,
                left: -quoteFontSize * 0.5,
                opacity: 0.14,
              }}
            >
              &ldquo;
            </span>
          )}
          {hanging && (
            <span aria-hidden style={{ ...quoteType, color: style.markColor }}>
              {open}
            </span>
          )}
          {style.marks === "large-beside" && (
            <span
              aria-hidden
              style={{
                ...largeMark(3.2),
                marginTop: -quoteFontSize * 0.3,
                marginRight: quoteFontSize * 0.45,
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
              {!hanging && mark(open)}
              {quote}
              {mark(close)}
            </blockquote>
            {author && (
              // In the quote's block, so it moves with it and stays in the padded box. Placed
              // across the text column like the quote in its box (`placementStyle`).
              <p
                {...{ [BANNER_AUTHOR_ATTRIBUTE]: "" }}
                style={{
                  position: "relative",
                  left: `${authorAt.x}%`,
                  transform: `translateX(-${authorAt.x}%)`,
                  width: "fit-content",
                  maxWidth: "100%",
                  marginTop: AUTHOR_GAP + authorAt.y,
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
    </Frame>
  );
}
