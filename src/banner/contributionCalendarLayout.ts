/**
 * Lays out GitHub's contribution weeks with one column per week and one row per weekday (0 is
 * Sunday). GitHub's first week can start mid-week, so padding counts from that week's Sunday.
 */

import type { ContributionWeekNormalized, ContributionMonthNormalized } from "@/src/github/types";

type PlacedCalendarDay = {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  col: number;
  row: number;
  isOutOfRange?: boolean;
};

type MonthLabel = {
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
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function msToYmd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Find the Sunday on or before the given date (UTC). */
function sundayOfWeek(ymd: string): number {
  const ms = utcDayMs(ymd);
  const dow = new Date(ms).getUTCDay(); // 0=Sun
  return ms - dow * MS_PER_DAY;
}

/** `renderPaddingDays` fills the empty weekday slots of the first and last weeks. */
export function buildCalendarLayout(options: {
  weeks: ContributionWeekNormalized[];
  months: ContributionMonthNormalized[];
  rangeEndYmd: string;
  renderPaddingDays?: boolean;
}): {
  placedDays: PlacedCalendarDay[];
  monthLabels: MonthLabel[];
  columnCount: number;
} {
  const { weeks, months, rangeEndYmd, renderPaddingDays = false } = options;

  const columnCount = weeks.length;
  const rangeEndMs = utcDayMs(rangeEndYmd);
  const placedDays: PlacedCalendarDay[] = [];

  for (let col = 0; col < weeks.length; col++) {
    const week = weeks[col];
    const placedDates = new Set<string>();

    for (const day of week.days) {
      placedDates.add(day.date);
      placedDays.push({ date: day.date, level: day.level, col, row: day.weekday });
    }

    if (renderPaddingDays) {
      const weekSundayMs = sundayOfWeek(week.firstDay);
      for (let row = 0; row < 7; row++) {
        const date = msToYmd(weekSundayMs + row * MS_PER_DAY);
        if (placedDates.has(date)) continue;
        placedDays.push({ date, level: 0, col, row, isOutOfRange: true });
      }
    }
  }

  // A month label too close to the previous one is skipped.
  const gridStartMs = sundayOfWeek(weeks[0].firstDay);
  const MS_PER_WEEK = 7 * MS_PER_DAY;
  const monthLabels: MonthLabel[] = [];
  let prevColIndex = -Infinity;

  for (const month of months) {
    const firstDayMs = utcDayMs(month.firstDay);
    if (firstDayMs > rangeEndMs) continue;
    const colIndex =
      firstDayMs < gridStartMs
        ? 0
        : Math.min(Math.floor((firstDayMs - gridStartMs) / MS_PER_WEEK), columnCount - 1);
    if (colIndex < prevColIndex + 2) continue;
    monthLabels.push({ label: month.name.slice(0, 3), colIndex });
    prevColIndex = colIndex;
  }

  return { placedDays, monthLabels, columnCount };
}
