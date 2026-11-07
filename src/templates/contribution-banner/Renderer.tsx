import { ContributionGrid, contributionGridStyle } from "@/src/banner/ContributionGrid";
import { FitContent } from "@/src/banner/FitContent";
import { contentFit } from "@/src/banner/contentPosition";
import { BANNER_SIZES, viewRect } from "@/src/lib/sizes";
import type { RendererProps } from "@/src/templates/types";

/** Cell size before FitContent scales the grid. */
const GRID = { cell: 12, gap: 3 };

/**
 * For Fill, the grid covers the banner and runs past its edges. On YouTube it covers the strip
 * desktop shows, so phones and desktop both see a full grid.
 */
const FILL_GRID = { cell: 22, gap: 4 };

export function ContributionBannerRenderer({ state, data }: RendererProps<"contribution-banner">) {
  const gridStyle = contributionGridStyle(state);
  const { contentSize } = state;

  if (!data.contributions) return null;
  if (contentSize === "fill") {
    return (
      <div style={{ position: "absolute", ...viewRect(BANNER_SIZES[state.size], "desktop") }}>
        <ContributionGrid
          contributions={data.contributions}
          {...gridStyle}
          cellSize={FILL_GRID.cell}
          gap={FILL_GRID.gap}
          fill
        />
      </div>
    );
  }
  return (
    <FitContent {...contentFit(state)} size={contentSize}>
      <ContributionGrid
        contributions={data.contributions}
        {...gridStyle}
        cellSize={GRID.cell}
        gap={GRID.gap}
      />
    </FitContent>
  );
}
