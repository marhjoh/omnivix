import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { backgroundFromState } from "@/src/banner/background";
import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSizeOrFill } from "@/src/banner/contentSize";
import { normalizeContentAlign } from "@/src/banner/contentAlign";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import type { Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import { themePresetById } from "@/src/types/theme";

/** Natural cell size; `FitContent` scales the grid to the chosen size and banner format. */
const GRID = { cell: 12, gap: 3 };

/** Fill: the grid covers the whole banner, with columns running past the edges. */
const FILL_GRID = { cell: 22, gap: 4 };

export function ContributionBannerRenderer({
  state,
  data,
  uiTheme,
}: {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}) {
  const theme = themePresetById(state.themeId);
  const contentSize = normalizeContentSizeOrFill(state.contentSize);
  const cellShape = contributionCellShapeFromState(state.cellShape);

  return (
    <Frame uiTheme={uiTheme} background={backgroundFromState(state)}>
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
          <FitContent size={contentSize} align={normalizeContentAlign(state.alignment)}>
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
