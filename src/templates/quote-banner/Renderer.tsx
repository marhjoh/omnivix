import { Frame } from "@/src/banner/Frame";
import { BannerMuted } from "@/src/banner/Text";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";

const QUOTE_SIZES: Record<string, { quote: number; author: number }> = {
  xs: { quote: 28, author: 14 },
  s: { quote: 36, author: 16 },
  m: { quote: 48, author: 20 },
  l: { quote: 58, author: 22 },
  xl: { quote: 66, author: 24 },
};

export function QuoteBannerRenderer({
  state,
  isExport = false,
  uiTheme = "dark",
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
  uiTheme?: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const alignment = (state.alignment as "left" | "center" | "right") ?? "left";
  const quote = String(state.quote ?? "");
  const author = String(state.author ?? "");
  const quoteSizeKey = (state.quoteSize as string) ?? "m";
  const quoteScale = QUOTE_SIZES[quoteSizeKey] ?? QUOTE_SIZES.m;

  const longText = quote.length > 120;
  const quoteFontSize = longText ? Math.max(24, Math.round(quoteScale.quote * 0.7)) : quoteScale.quote;
  const authorFontSize = Math.max(12, Math.round(quoteScale.author));

  return (
    <Frame
      appTheme={uiTheme}
      backgroundImage={backgroundImage}
      isExport={isExport}
      style={{ background: chrome.baseBg, color: chrome.text }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          padding: "32px 40px",
          textAlign: alignment,
          overflow: "hidden",
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
            WebkitLineClamp: longText ? 5 : 3,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
          }}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>
        {author && (
          <BannerMuted
            style={{
              marginTop: 16,
              fontSize: authorFontSize,
              color: chrome.textMuted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            - {author}
          </BannerMuted>
        )}
      </div>
    </Frame>
  );
}
