import { ContributionsNormalized } from "@/src/github/normalize";
import { ThemePreset } from "@/src/types/theme";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ContributionGridProps {
  contributions: ContributionsNormalized;
  theme: ThemePreset;
  cellSize?: number;
  gap?: number;
  showMonthLabels?: boolean;
  showDayLabels?: boolean;
  showTotal?: boolean;
  fill?: boolean;
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
}: ContributionGridProps) {
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

  const dayLabelWidth = showDayLabels ? 30 : 0;
  const monthLabelHeight = showMonthLabels ? 18 : 0;
  const step = cellSize + gap;
  const gridW = grid.length * step - gap;
  const gridH = 7 * step - gap;
  const totalLine = showTotal ? 22 : 0;
  const svgW = dayLabelWidth + gridW;
  const svgH = monthLabelHeight + gridH + totalLine;

  return (
    <div style={{ width: fill ? "100%" : "fit-content", height: fill ? "100%" : "auto", maxWidth: "100%", overflow: "hidden" }}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block", width: "100%", height: fill ? "100%" : "auto" }}
        preserveAspectRatio={fill ? "xMidYMid slice" : "xMinYMin meet"}
      >
        {showMonthLabels &&
          monthLabels.map(({ label, colIndex }) => (
            <text
              key={`m-${colIndex}`}
              x={dayLabelWidth + colIndex * step}
              y={monthLabelHeight - 5}
              fill={theme.textSecondary}
              fontSize={10}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {label}
            </text>
          ))}

        {showDayLabels &&
          [1, 3, 5].map((row) => (
            <text
              key={`d-${row}`}
              x={0}
              y={monthLabelHeight + row * step + cellSize * 0.78}
              fill={theme.textSecondary}
              fontSize={9}
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
              rx={2}
              ry={2}
              fill={cell ? theme.gridLevels[cell.level] : theme.gridLevels[0]}
            />
          )),
        )}

        {showTotal && (
          <text
            x={svgW}
            y={monthLabelHeight + gridH + 16}
            fill={theme.textSecondary}
            fontSize={11}
            fontFamily="system-ui, -apple-system, sans-serif"
            textAnchor="end"
          >
            {contributions.total.toLocaleString()} contributions in the last year
          </text>
        )}
      </svg>
    </div>
  );
}
