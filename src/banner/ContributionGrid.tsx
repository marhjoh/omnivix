import { useMemo } from "react";
import type { ContributionsNormalized } from "@/src/github/types";
import { buildCalendarLayout, DAY_LABEL_ROWS } from "@/src/banner/contributionCalendarLayout";
import type { ContributionCellShape } from "@/src/banner/cellShape";
import { gridColorsById, type GridColorPreset } from "@/src/banner/gridColors";
import type { ContributionGridSettings } from "@/src/templates/stateSchemas";

/** The Grid colors and Cell shape settings, as the grid takes them. */
export function contributionGridStyle(state: ContributionGridSettings) {
  return { colors: gridColorsById(state.themeId), cellShape: state.cellShape };
}

const CELL_RADIUS: Record<ContributionCellShape, number> = {
  square: 0,
  rounded: 0.16,
  circle: 0.5,
};

interface ContributionGridProps {
  contributions: ContributionsNormalized;
  colors: GridColorPreset;
  cellShape: ContributionCellShape;
  cellSize: number;
  gap: number;
  showMonthLabels?: boolean;
  /** Mon/Wed/Fri labels in the left gutter. */
  showDayLabels?: boolean;
  showTotal?: boolean;
  /**
   * Covers the container. The SVG stretches with CSS only, the first and last weeks get faded
   * padding cells, and cells lose their outline.
   */
  fill?: boolean;
}

export function ContributionGrid({
  contributions,
  colors,
  cellShape,
  cellSize,
  gap,
  showMonthLabels = false,
  showDayLabels = false,
  showTotal = false,
  fill = false,
}: ContributionGridProps) {
  const radius = cellSize * CELL_RADIUS[cellShape];
  // About 370 cells. Dragging the background re-renders the banner often, so this is worth keeping.
  const { placedDays, monthLabels, columnCount } = useMemo(
    () =>
      buildCalendarLayout({
        weeks: contributions.weeks,
        months: contributions.months,
        rangeEndYmd: contributions.rangeEndYmd,
        renderPaddingDays: fill,
      }),
    [contributions, fill],
  );

  const dayLabelWidth = showDayLabels ? 28 : 0;
  const monthLabelHeight = showMonthLabels ? 20 : 0;
  const step = cellSize + gap;
  const gridW = columnCount * step - gap;
  const gridH = 7 * step - gap;
  const footerHeight = showTotal ? 28 : 0;
  const svgW = dayLabelWidth + gridW;
  const svgH = monthLabelHeight + gridH + footerHeight;
  const viewPad = fill ? 0 : 1;
  const vbW = svgW + 2 * viewPad;
  const vbH = svgH + 2 * viewPad;

  return (
    <div
      style={{
        width: fill ? "100%" : "fit-content",
        height: fill ? "100%" : "auto",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <svg
        width={vbW}
        height={vbH}
        viewBox={`-${viewPad} -${viewPad} ${vbW} ${vbH}`}
        style={{ display: "block", width: "100%", height: fill ? "100%" : "auto" }}
        preserveAspectRatio={fill ? "xMidYMid slice" : "xMinYMin meet"}
      >
        {showMonthLabels &&
          monthLabels.map(({ label, colIndex }) => (
            <text
              key={`m-${colIndex}-${label}`}
              x={dayLabelWidth + colIndex * step}
              y={monthLabelHeight - 6}
              fill="currentColor"
              fontSize={10}
              fontWeight={500}
            >
              {label}
            </text>
          ))}

        {showDayLabels &&
          DAY_LABEL_ROWS.map(({ label, row }) => (
            <text
              key={`d-${row}`}
              x={2}
              y={monthLabelHeight + row * step + cellSize * 0.72}
              fill="currentColor"
              fontSize={9}
              fontWeight={500}
            >
              {label}
            </text>
          ))}

        {placedDays.map(({ date, level, col, row, isOutOfRange }) => (
          <rect
            key={date}
            x={dayLabelWidth + col * step}
            y={monthLabelHeight + row * step}
            width={cellSize}
            height={cellSize}
            rx={radius}
            fill={colors.gridLevels[level]}
            stroke={fill ? undefined : "rgba(255,255,255,0.14)"}
            strokeWidth={fill ? 0 : 0.6}
            opacity={isOutOfRange ? 0.3 : 1}
          />
        ))}

        {showTotal && (
          <text
            x={svgW - 1}
            y={monthLabelHeight + gridH + 17}
            fill="currentColor"
            fontSize={11}
            textAnchor="end"
          >
            {/* A fixed locale, so the preview and the server-rendered export match. */}
            {contributions.total.toLocaleString("en-US")} contributions
          </text>
        )}
      </svg>
    </div>
  );
}
