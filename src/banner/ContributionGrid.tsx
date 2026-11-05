import { useMemo } from "react";
import type { ContributionsNormalized } from "@/src/github/types";
import { buildCalendarLayout, DAY_LABEL_ROWS } from "@/src/banner/contributionCalendarLayout";
import { contributionCellShapeFromState, type ContributionCellShape } from "@/src/banner/cellShape";
import { gridColorsById, type GridColorPreset } from "@/src/banner/gridColors";

/** The grid's look from banner state: its Grid colors and Cell shape settings. */
export function contributionGridStyle(state: Record<string, unknown>) {
  return {
    colors: gridColorsById(state.themeId),
    cellShape: contributionCellShapeFromState(state.cellShape),
  };
}

function cellRadii(shape: ContributionCellShape, cellSize: number): { rx: number; ry: number } {
  if (shape === "square") return { rx: 0, ry: 0 };
  if (shape === "circle") {
    const r = cellSize / 2;
    return { rx: r, ry: r };
  }
  const r = Math.min(cellSize * 0.22, Math.max(1.25, cellSize * 0.16));
  const cap = cellSize / 2 - 0.001;
  const clamped = Math.min(r, cap);
  return { rx: clamped, ry: clamped };
}

interface ContributionGridProps {
  contributions: ContributionsNormalized;
  colors: GridColorPreset;
  cellShape: ContributionCellShape;
  cellSize: number;
  gap: number;
  showMonthLabels?: boolean;
  /**
   * Semantic Mon/Wed/Fri labels in the left gutter.
   * Calendar-correct: the row labeled "Mon" contains actual Mondays.
   */
  showDayLabels?: boolean;
  showTotal?: boolean;
  /**
   * Cover the container: the SVG is stretched to it (CSS only, no layout change), the first and
   * last weeks' empty weekday slots get out-of-range cells, and cells have no outline.
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
  const cellOutline = !fill;
  const { rx, ry } = cellRadii(cellShape, cellSize);
  // About 370 cells; worth keeping while the banner re-renders (e.g. dragging the background).
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

  if (!contributions.weeks.length) {
    return (
      <div
        style={{
          padding: "20px 16px",
          textAlign: "center",
          fontSize: 13,
          lineHeight: 1.45,
          color: "currentColor",
          maxWidth: 300,
        }}
      >
        No contribution calendar data for this range.
      </div>
    );
  }

  const dayLabelWidth = showDayLabels ? 28 : 0;
  const monthLabelHeight = showMonthLabels ? 20 : 0;
  const step = cellSize + gap;
  const gridW = columnCount * step - gap;
  const gridH = 7 * step - gap;
  const footerHeight = showTotal ? 28 : 0;
  const svgW = dayLabelWidth + gridW;
  const svgH = monthLabelHeight + gridH + footerHeight;
  const viewPad = cellOutline ? 1 : 0;
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
            rx={rx}
            ry={ry}
            fill={colors.gridLevels[level]}
            stroke={cellOutline ? "rgba(255,255,255,0.14)" : undefined}
            strokeWidth={cellOutline ? 0.6 : 0}
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
            dominantBaseline="alphabetic"
          >
            {/* A fixed locale, so the preview and the server-rendered export match. */}
            {contributions.total.toLocaleString("en-US")} contributions
          </text>
        )}
      </svg>
    </div>
  );
}
