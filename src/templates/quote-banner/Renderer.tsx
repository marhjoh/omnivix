import { Frame } from "@/src/banner/Frame";
import { BannerMuted } from "@/src/banner/Text";
import { RenderData } from "@/src/templates/renderers/types";
import { THEME_PRESETS } from "@/src/types/theme";

export function QuoteBannerRenderer({
  state,
  isExport = false,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
}) {
  const theme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const alignment = (state.alignment as "left" | "center" | "right") ?? "left";
  const quote = String(state.quote ?? "");
  const author = String(state.author ?? "");

  const longText = quote.length > 120;
  const fontSize = longText ? 32 : 48;

  return (
    <Frame backgroundImage={backgroundImage} isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
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
            fontSize,
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
              fontSize: 20,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            &mdash; {author}
          </BannerMuted>
        )}
      </div>
    </Frame>
  );
}
