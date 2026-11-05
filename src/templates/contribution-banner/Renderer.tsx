import { ContributionGrid, contributionGridStyle } from "@/src/banner/ContributionGrid";
import { FitContent } from "@/src/banner/FitContent";
import { normalizeContentSizeOrFill } from "@/src/banner/contentSize";
import { contentFit } from "@/src/banner/contentPosition";
import { bannerFormatOf, viewRect } from "@/src/lib/sizes";
import type { RendererProps } from "@/src/templates/types";

/** Cell size before FitContent scales the grid. */
const GRID = { cell: 12, gap: 3 };

/**
 * For Fill, the grid covers the banner and runs past its edges. On YouTube it covers the strip
 * desktop shows, so phones and desktop both see a full grid.
 */
const FILL_GRID = { cell: 22, gap: 4 };

export function ContributionBannerRenderer({ state, data }: RendererProps) {
  const gridStyle = contributionGridStyle(state);
  const contentSize = normalizeContentSizeOrFill(state.contentSize);

  if (!data.contributions) return null;
  if (contentSize === "fill") {
    return (
      <div style={{ position: "absolute", ...viewRect(bannerFormatOf(state.size), "desktop") }}>
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
