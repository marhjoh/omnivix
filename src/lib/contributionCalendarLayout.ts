/**
 * Calendar-aligned contribution grid layout driven by GitHub's authoritative
 * `contributionCalendar.weeks` and `contributionCalendar.months`.
 *
 * Key contract:
 *   columnCount = weeks.length  (always; fillMode never adds columns)
 *   row = weekday (0=Sun..6=Sat)
 *   col = week index
 *
 * `renderPaddingDays` fills empty weekday slots in the first/last week column
 * with out-of-range cells (level=0). It never creates extra week columns.
 *
 * GitHub's first week for a year range may start on the range start (e.g.,
 * Wednesday Jan 1), not on the previous Sunday. The layout handles this
 * by using API-provided days as the authoritative source and computing
 * the week's Sunday for padding.
 */

import type {
  ContributionWeekNormalized,
  ContributionMonthNormalized,
} from "@/src/github/normalize";

export type PlacedCalendarDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  col: number;
  row: number;
  isOutOfRange?: boolean;
};

export type MonthLabel = {
  label: string;
  colIndex: number;
};

export const DAY_LABEL_ROWS: Array<{ label: string; row: number }> = [
  { label: "Mon", row: 1 },
  { label: "Wed", row: 3 },
  { label: "Fri", row: 5 },
];

const MS_PER_DAY = 86400000;

function utcDayMs(ymd: string): number {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function msToYmd(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Find the Sunday on or before the given date (UTC). */
function sundayOfWeek(ymd: string): number {
  const ms = utcDayMs(ymd);
  const dow = new Date(ms).getUTCDay(); // 0=Sun
  return ms - dow * MS_PER_DAY;
}

/**
 * Build calendar-aligned grid layout from GitHub weeks and months.
 *
 * For each week column we place the API-provided `contributionDays` first
 * (authoritative in-range cells). When `renderPaddingDays` is true we then
 * fill the remaining weekday slots with synthetic out-of-range padding.
 *
 * Padding dates are derived from the week's actual Sunday (which may differ
 * from `week.firstDay` when GitHub returns a partial first week starting on
 * the range start rather than the preceding Sunday).
 */
export function buildCalendarLayout(options: {
  weeks: ContributionWeekNormalized[];
  months: ContributionMonthNormalized[];
  rangeStartYmd: string;
  rangeEndYmd: string;
  renderPaddingDays?: boolean;
}): {
  placedDays: PlacedCalendarDay[];
  monthLabels: MonthLabel[];
  columnCount: number;
} {
  const { weeks, months, rangeEndYmd, renderPaddingDays = false } = options;

  if (weeks.length === 0) {
    return { placedDays: [], monthLabels: [], columnCount: 0 };
  }

  const columnCount = weeks.length;
  const rangeEndMs = utcDayMs(rangeEndYmd);
  const placedDays: PlacedCalendarDay[] = [];

  for (let col = 0; col < weeks.length; col++) {
    const week = weeks[col];
    const placedDates = new Set<string>();

    for (const day of week.days) {
      const row = day.weekday;
      placedDates.add(day.date.slice(0, 10));
      placedDays.push({
        date: day.date,
        count: day.count,
        level: day.level,
        weekday: day.weekday,
        col,
        row,
      });
    }

    if (renderPaddingDays) {
      const weekSundayMs = sundayOfWeek(week.firstDay);
      for (let wd = 0; wd < 7; wd++) {
        const cellMs = weekSundayMs + wd * MS_PER_DAY;
        const date = msToYmd(cellMs);
        if (placedDates.has(date)) continue;
        const weekday = wd as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        placedDays.push({
          date,
          count: 0,
          level: 0,
          weekday,
          col,
          row: weekday,
          isOutOfRange: true,
        });
      }
    }
  }

  // Month labels from GitHub months metadata.
  const gridStartMs = sundayOfWeek(weeks[0].firstDay);
  const MS_PER_WEEK = 7 * MS_PER_DAY;
  const monthLabels: MonthLabel[] = [];
  let prevColIndex = -Infinity;

  for (const month of months) {
    const firstDayMs = utcDayMs(month.firstDay);
    if (firstDayMs > rangeEndMs) continue;
    const colIndex = firstDayMs < gridStartMs
      ? 0
      : Math.min(Math.floor((firstDayMs - gridStartMs) / MS_PER_WEEK), columnCount - 1);
    if (colIndex < prevColIndex + 2 && prevColIndex !== -Infinity) continue;
    monthLabels.push({ label: month.name.slice(0, 3), colIndex });
    prevColIndex = colIndex;
  }

  return { placedDays, monthLabels, columnCount };
}
