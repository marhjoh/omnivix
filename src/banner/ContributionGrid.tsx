import type { ContributionCellShape } from "@/src/templates/definitions";
import { ContributionsNormalized } from "@/src/github/normalize";
import { buildCalendarLayout, DAY_LABEL_ROWS } from "@/src/lib/contributionCalendarLayout";
import { ThemePreset } from "@/src/types/theme";

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
  theme: ThemePreset;
  cellSize?: number;
  gap?: number;
  showMonthLabels?: boolean;
  /**
   * Semantic Mon/Wed/Fri labels in the left gutter.
   * Calendar-correct: the row labelled "Mon" contains actual Mondays.
   */
  showDayLabels?: boolean;
  showTotal?: boolean;
  /** Fill empty weekday slots in the first/last week with out-of-range cells. */
  renderPaddingDays?: boolean;
  /** Stretch SVG to fill its container (CSS only, no layout change). */
  fill?: boolean;
  cellOutline?: boolean;
  labelFill?: string;
  totalFill?: string;
  cellShape?: ContributionCellShape;
}

export function ContributionGrid({
  contributions,
  theme,
  cellSize = 11,
  gap = 3,
  showMonthLabels = false,
  showDayLabels = false,
  showTotal = false,
  renderPaddingDays = false,
  fill = false,
  cellOutline = true,
  labelFill,
  totalFill,
  cellShape = "rounded",
}: ContributionGridProps) {
  const monthDayColor = labelFill ?? theme.textSecondary;
  const footerColor = totalFill ?? theme.textSecondary;
  const { rx, ry } = cellRadii(cellShape, cellSize);

  if (!contributions.weeks?.length) {
    return (
      <div
        style={{
          padding: "20px 16px",
          textAlign: "center",
          fontSize: 13,
          lineHeight: 1.45,
          color: monthDayColor,
          maxWidth: 300,
        }}
      >
        No contribution calendar data for this range.
      </div>
    );
  }

  const { placedDays, monthLabels, columnCount } = buildCalendarLayout({
    weeks: contributions.weeks,
    months: contributions.months ?? [],
    rangeStartYmd: contributions.rangeStartYmd,
    rangeEndYmd: contributions.rangeEndYmd,
    renderPaddingDays,
  });

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
    <div style={{ width: fill ? "100%" : "fit-content", height: fill ? "100%" : "auto", maxWidth: "100%", overflow: "hidden" }}>
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
              fill={monthDayColor}
              fontSize={10}
              fontWeight={500}
              fontFamily="system-ui, -apple-system, sans-serif"
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
              fill={monthDayColor}
              fontSize={9}
              fontWeight={500}
              fontFamily="system-ui, -apple-system, sans-serif"
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
            fill={theme.gridLevels[level]}
            stroke={cellOutline ? "rgba(255,255,255,0.14)" : undefined}
            strokeWidth={cellOutline ? 0.6 : 0}
            opacity={isOutOfRange ? 0.3 : 1}
          />
        ))}

        {showTotal && (
          <text
            x={svgW - 1}
            y={monthLabelHeight + gridH + 17}
            fill={footerColor}
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            textAnchor="end"
            dominantBaseline="alphabetic"
          >
            {contributions.total.toLocaleString()} contributions
          </text>
        )}
      </svg>
    </div>
  );
}
