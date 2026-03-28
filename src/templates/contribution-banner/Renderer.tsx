import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { Frame } from "@/src/banner/Frame";
import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { RenderData } from "@/src/templates/renderers/types";
import { THEME_PRESETS } from "@/src/types/theme";

/** Tuned so XL stays wider than L but not so wide that preview scales both to ~same on-screen cell size (high cell/svgW ratio). */
const GRID_SIZES: Record<string, { cell: number; gap: number }> = {
  xs:   { cell: 6,  gap: 2 },
  s:    { cell: 9,  gap: 2 },
  m:    { cell: 13, gap: 3 },
  l:    { cell: 17, gap: 3 },
  xl:   { cell: 20, gap: 3 },
  fill: { cell: 22, gap: 4 },
};

export function ContributionBannerRenderer({
  state,
  data,
  isExport = false,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
}) {
  const theme = THEME_PRESETS.find((preset) => preset.id === state.themeId) ?? THEME_PRESETS[0];
  const backgroundImage = typeof state.backgroundImage === "string" ? state.backgroundImage : undefined;
  const username = typeof state.username === "string" ? state.username : "";
  const sizeKey = (state.gridSize as string) ?? "l";
  const isFill = sizeKey === "fill";
  const sizing = GRID_SIZES[sizeKey] ?? GRID_SIZES.l;
  const cellShape = contributionCellShapeFromState(state.cellShape);

  if (!username) {
    return (
      <Frame isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
        <div style={{ display: "grid", placeItems: "center", height: "100%", opacity: 0.35, textAlign: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.svg" alt="" style={{ width: 40, height: 40, margin: "0 auto" }} />
          <p style={{ fontSize: 16 }}>Select a GitHub profile to get started</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame backgroundImage={backgroundImage} isExport={isExport} style={{ background: theme.background, color: theme.textPrimary }}>
      <div
        style={{
          display: "grid",
          placeItems: "center",
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
            cellOutline={!isFill}
            cellShape={cellShape}
          />
        ) : null}
      </div>
    </Frame>
  );
}
