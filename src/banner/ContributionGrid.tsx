import { useMemo } from "react";
import type { ContributionDayNormalized, ContributionsNormalized } from "@/src/github/types";
import { buildCalendarLayout, DAY_LABEL_ROWS } from "@/src/banner/contributionCalendarLayout";
import type { ContributionCellShape } from "@/src/banner/cellShape";
import { gridColorsById, type GridColorPreset } from "@/src/banner/gridColors";
import type { ContributionGridSettings } from "@/src/templates/stateSchemas";
import { gridTextCells } from "@/src/banner/gridText";

/** The Grid colors and Cell shape settings, as the grid takes them. */
export function contributionGridStyle(state: ContributionGridSettings) {
  return { colors: gridColorsById(state.themeId), cellShape: state.cellShape };
}

/**
 * A cell's level with text in the grid. `lit` is undefined without text. Letters take the top
 * level. The contributions behind them drop to the lowest level, which keeps them visible and works
 * on light and dark backgrounds, unlike fading.
 */
function withText(
  level: ContributionDayNormalized["level"],
  lit: boolean | undefined,
  overContributions: boolean,
): ContributionDayNormalized["level"] {
  if (lit === undefined) return level;
  if (lit) return 4;
  return overContributions ? (Math.min(level, 1) as 0 | 1) : 0;
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
  /** Pixel letters drawn at the top level (gridText.ts). */
  text?: string;
  /** Keeps the contributions behind the text, at the lowest level. Otherwise the grid is empty. */
  textOverContributions?: boolean;
  /** The columns the text may take. Fill shows only part of the grid. */
  textColumns?: number;
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
  text = "",
  textOverContributions = false,
  textColumns,
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
  const textCells = useMemo(
    () => (text ? gridTextCells(text, columnCount, textColumns) : null),
    [text, columnCount, textColumns],
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

        {placedDays.map(({ date, level, col, row, isOutOfRange }) => {
          const shownLevel = withText(
            level,
            textCells?.has(`${col},${row}`),
            textOverContributions,
          );
          return (
            <rect
              key={date}
              x={dayLabelWidth + col * step}
              y={monthLabelHeight + row * step}
              width={cellSize}
              height={cellSize}
              rx={radius}
              fill={colors.gridLevels[shownLevel]}
              stroke={fill ? undefined : "rgba(255,255,255,0.14)"}
              strokeWidth={fill ? 0 : 0.6}
              opacity={isOutOfRange ? 0.3 : 1}
            />
          );
        })}

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
