import type { ContributionCellShape } from "@/src/templates/definitions";
import { ContributionsNormalized } from "@/src/github/normalize";
import { ThemePreset } from "@/src/types/theme";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cellRadii(shape: ContributionCellShape, cellSize: number): { rx: number; ry: number } {
  if (shape === "square") return { rx: 0, ry: 0 };
  if (shape === "circle") {
    const r = cellSize / 2;
    return { rx: r, ry: r };
  }
  // Rounded: scale with cell so tiny cells are not perfect circles (fixed rx was rx=3 on 6px → circle)
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
  showDayLabels?: boolean;
  showTotal?: boolean;
  fill?: boolean;
  /** Subtle outline so cells read clearly on busy backgrounds */
  cellOutline?: boolean;
  /** When set, month/day/total use these instead of theme text (theme still drives cell colors only) */
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
  fill = false,
  cellOutline = true,
  labelFill,
  totalFill,
  cellShape = "rounded",
}: ContributionGridProps) {
  const monthDayColor = labelFill ?? theme.textSecondary;
  const footerColor = totalFill ?? theme.textSecondary;
  const { rx, ry } = cellRadii(cellShape, cellSize);
  if (!contributions?.weeks?.length) return null;

  const today = new Date().toISOString().slice(0, 10);

  type Cell = { date: string; level: 0 | 1 | 2 | 3 | 4; count: number };

  const grid: Array<Array<Cell | null>> = [];

  for (const week of contributions.weeks) {
    const column: Array<Cell | null> = new Array(7).fill(null);

    for (const day of week.days) {
      if (day.date > today) continue;
      const dow = new Date(day.date + "T12:00:00").getDay();
      column[dow] = { date: day.date, level: day.level, count: day.count };
    }

    if (column.some((d) => d !== null)) {
      grid.push(column);
    }
  }

  if (grid.length === 0) return null;

  const monthLabels: Array<{ label: string; colIndex: number }> = [];
  if (showMonthLabels) {
    let prevMonth = -1;
    for (let col = 0; col < grid.length; col++) {
      const firstDay = grid[col].find((d) => d !== null);
      if (!firstDay) continue;
      const month = new Date(firstDay.date + "T12:00:00").getMonth();
      if (month !== prevMonth) {
        monthLabels.push({ label: MONTH_LABELS[month], colIndex: col });
        prevMonth = month;
      }
    }
  }

  const dayLabelWidth = showDayLabels ? 28 : 0;
  const monthLabelHeight = showMonthLabels ? 20 : 0;
  const step = cellSize + gap;
  const gridW = grid.length * step - gap;
  const gridH = 7 * step - gap;
  /** Room below grid for total line (font ~11px + descenders + padding) */
  const footerHeight = showTotal ? 28 : 0;
  const svgW = dayLabelWidth + gridW;
  const svgH = monthLabelHeight + gridH + footerHeight;
  /** Stroke is centered on the rect path; pad viewBox so outer half of stroke is not clipped (obvious on XS / circle). */
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
        preserveAspectRatio={fill ? "xMidYMid meet" : "xMinYMin meet"}
      >
        {showMonthLabels &&
          monthLabels.map(({ label, colIndex }) => (
            <text
              key={`m-${colIndex}`}
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
          [1, 3, 5].map((row) => (
            <text
              key={`d-${row}`}
              x={showDayLabels ? 2 : 0}
              y={monthLabelHeight + row * step + cellSize * 0.72}
              fill={monthDayColor}
              fontSize={9}
              fontWeight={500}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {DAY_LABELS[row]}
            </text>
          ))}

        {grid.map((column, ci) =>
          column.map((cell, ri) => (
            <rect
              key={`${ci}-${ri}`}
              x={dayLabelWidth + ci * step}
              y={monthLabelHeight + ri * step}
              width={cellSize}
              height={cellSize}
              rx={rx}
              ry={ry}
              fill={cell ? theme.gridLevels[cell.level] : theme.gridLevels[0]}
              stroke={cellOutline ? "rgba(255,255,255,0.14)" : undefined}
              strokeWidth={cellOutline ? 0.6 : 0}
            />
          )),
        )}

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
            {contributions.total.toLocaleString()} contributions in the last year
          </text>
        )}
      </svg>
    </div>
  );
}
