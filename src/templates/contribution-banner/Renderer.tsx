import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { bannerUiChrome, type Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import { THEME_PRESETS } from "@/src/types/theme";

const GRID_SIZES: Record<string, { cell: number; gap: number }> = {
  xs:   { cell: 4,  gap: 1 },
  s:    { cell: 6,  gap: 2 },
  m:    { cell: 8, gap: 3 },
  l:    { cell: 12, gap: 4 },
  xl:   { cell: 15, gap: 3 },
  fill: { cell: 22, gap: 4 },
};

const FLEX_ALIGN: Record<string, "flex-start" | "center" | "flex-end"> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

export function ContributionBannerRenderer({
  state,
  data,
  isExport = false,
  uiTheme = "dark",
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
  uiTheme?: Theme;
}) {
  const chrome = bannerUiChrome(uiTheme);
  const theme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";
  const sizeKey = (state.gridSize as string) ?? "l";
  const isFill = sizeKey === "fill";
  const sizing = GRID_SIZES[sizeKey] ?? GRID_SIZES.l;
  const gridPosition = (((state.gridPosition ?? "center") as string) || "center");
  const cellShape = contributionCellShapeFromState(state.cellShape);

  if (!username) {
    return (
      <Frame appTheme={uiTheme} isExport={isExport} style={{ background: chrome.baseBg, color: chrome.text }}>
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
          <img src={chrome.emptyStateIconSrc} alt="" style={{ width: 40, height: 40, margin: "0 auto" }} />
          <p style={{ fontSize: 16, color: chrome.text }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

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
          justifyContent: "center",
          alignItems: FLEX_ALIGN[gridPosition] ?? "center",
          flexDirection: "column",
          height: "100%",
          padding: isFill ? 0 : 16,
          overflow: "hidden",
        }}
      >
        {data.contributions ? (
          <ContributionGrid
            contributions={data.contributions}
            theme={theme}
            cellSize={sizing.cell}
            gap={sizing.gap}
            fill={isFill}
            renderPaddingDays={isFill}
            cellOutline={!isFill}
            cellShape={cellShape}
          />
        ) : null}
      </div>
    </Frame>
  );
}
