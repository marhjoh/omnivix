import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { backgroundFromState } from "@/src/banner/background";
import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSizeOrFill } from "@/src/banner/contentSize";
import { normalizeContentAlign } from "@/src/banner/contentAlign";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import { THEME_PRESETS } from "@/src/types/theme";

/** Natural cell size; `FitContent` scales the grid to the chosen size and banner format. */
const GRID = { cell: 12, gap: 3 };

/** Fill: the grid covers the whole banner, with columns running past the edges. */
const FILL_GRID = { cell: 22, gap: 4 };

export function ContributionBannerRenderer({
  state,
  data,
  uiTheme = "dark",
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme?: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const theme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const background = backgroundFromState(state);
  const username = typeof state.username === "string" ? state.username : "";
  const contentSize = normalizeContentSizeOrFill(state.contentSize);
  const alignment = normalizeContentAlign(state.alignment);
  const cellShape = contributionCellShapeFromState(state.cellShape);

  if (!username) {
    return (
      <Frame appTheme={uiTheme} style={{ background: chrome.baseBg, color: chrome.text }}>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            height: "100%",
            opacity: 0.55,
            textAlign: "center",
            gap: 8,
            color: chrome.textMuted,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chrome.emptyStateIconSrc}
            alt=""
            style={{ width: 40, height: 40, margin: "0 auto" }}
          />
          <p style={{ fontSize: 16, color: chrome.text }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      appTheme={uiTheme}
      background={background}
      style={{ background: chrome.baseBg, color: chrome.text }}
    >
      {data.contributions &&
        (contentSize === "fill" ? (
          <ContributionGrid
            contributions={data.contributions}
            theme={theme}
            cellSize={FILL_GRID.cell}
            gap={FILL_GRID.gap}
            fill
            renderPaddingDays
            cellOutline={false}
            cellShape={cellShape}
          />
        ) : (
          <FitContent size={contentSize} align={alignment}>
            <ContributionGrid
              contributions={data.contributions}
              theme={theme}
              cellSize={GRID.cell}
              gap={GRID.gap}
              cellShape={cellShape}
            />
          </FitContent>
        ))}
    </Frame>
  );
}
