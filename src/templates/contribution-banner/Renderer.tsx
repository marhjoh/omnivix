import { ContributionGrid } from "@/src/banner/ContributionGrid";
import { Frame } from "@/src/banner/Frame";
import { logoFromState } from "@/src/banner/logo";
import { backgroundFromState } from "@/src/banner/background";
import { FitContent } from "@/src/banner/FitContent";
import { contentBoxOf } from "@/src/banner/fit";
import { normalizeContentSizeOrFill } from "@/src/banner/contentSize";
import { contentPositionFromState } from "@/src/banner/contentPosition";
import { contributionCellShapeFromState } from "@/src/templates/definitions";
import { bannerFormatOf, viewRect } from "@/src/lib/sizes";
import type { Theme } from "@/src/theme/theme";
import { RenderData } from "@/src/templates/renderers/types";
import { themePresetById } from "@/src/types/theme";

/** Natural cell size; `FitContent` scales the grid to the chosen size and banner format. */
const GRID = { cell: 12, gap: 3 };

/**
 * Fill: the grid covers the banner, with columns running past the edges. On YouTube it covers the
 * strip desktop shows, so phones and desktop see a full grid.
 */
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
    <Frame uiTheme={uiTheme} background={backgroundFromState(state)} logo={logoFromState(state)}>
      {data.contributions &&
        (contentSize === "fill" ? (
          <div style={{ position: "absolute", ...viewRect(bannerFormatOf(state.size), "desktop") }}>
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
          </div>
        ) : (
          <FitContent
            box={contentBoxOf(state.size)}
            size={contentSize}
            position={contentPositionFromState(state)}
          >
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
