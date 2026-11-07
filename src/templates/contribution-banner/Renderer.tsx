import { ContributionGrid, contributionGridStyle } from "@/src/banner/ContributionGrid";
import { FitContent } from "@/src/banner/FitContent";
import { contentFit } from "@/src/banner/contentPosition";
import { BANNER_SIZES, viewRect, type BannerSize } from "@/src/lib/sizes";
import type { RendererProps } from "@/src/templates/types";

/** Cell size before FitContent scales the grid. */
const GRID = { cell: 12, gap: 3 };

/**
 * For Fill, the grid covers the banner and runs past its edges. On YouTube it covers the strip
 * desktop shows, so phones and desktop both see a full grid.
 */
const FILL_GRID = { cell: 22, gap: 4 };

/**
 * The grid columns every device shows in Fill, less one on each side, so the text fits them.
 * Fill scales the grid to the banner's height, and phones may cut off the sides.
 */
function fillTextColumns(size: BannerSize): number {
  const format = BANNER_SIZES[size];
  const shown = viewRect(format, "desktop");
  const width = Math.min(shown.width, viewRect(format, "phone").width);
  const step = FILL_GRID.cell + FILL_GRID.gap;
  const gridHeight = 7 * step - FILL_GRID.gap;
  const columns = Math.floor(((width / shown.height) * gridHeight + FILL_GRID.gap) / step);
  return columns - 2;
}

export function ContributionBannerRenderer({ state, data }: RendererProps<"contribution-banner">) {
  const gridStyle = contributionGridStyle(state);
  const gridText = { text: state.gridText, textOverContributions: state.showContributions };
  const { contentSize } = state;

  if (!data.contributions) return null;
  if (contentSize === "fill") {
    return (
      <div style={{ position: "absolute", ...viewRect(BANNER_SIZES[state.size], "desktop") }}>
        <ContributionGrid
          contributions={data.contributions}
          {...gridStyle}
          {...gridText}
          textColumns={fillTextColumns(state.size)}
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
        {...gridText}
        cellSize={GRID.cell}
        gap={GRID.gap}
      />
    </FitContent>
  );
}
