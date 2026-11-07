import { describe, expect, it } from "vitest";
import { buildCalendarLayout, DAY_LABEL_ROWS } from "./contributionCalendarLayout";
import type {
  ContributionWeekNormalized,
  ContributionMonthNormalized,
  ContributionDayNormalized,
} from "@/src/github/types";

function weekdayFromYmd(ymd: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function parseYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function ymdFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Builds weeks the way GitHub returns them. The first week starts on rangeStart, which may not be a
 * Sunday, and the rest start on Sundays. `days` only holds days in the range.
 */
function buildWeeksForRange(rangeStart: string, rangeEnd: string): ContributionWeekNormalized[] {
  const rangeStartMs = parseYmd(rangeStart);
  const rangeEndMs = parseYmd(rangeEnd);
  const startWd = weekdayFromYmd(rangeStart);

  const weeks: ContributionWeekNormalized[] = [];

  // The first week may be partial, from rangeStart to the next Saturday.
  const firstWeekEnd = rangeStartMs + (6 - startWd) * 86400000;
  const firstWeekDays: ContributionDayNormalized[] = [];
  for (let ms = rangeStartMs; ms <= Math.min(firstWeekEnd, rangeEndMs); ms += 86400000) {
    const date = ymdFromMs(ms);
    firstWeekDays.push({ date, count: 0, level: 0, weekday: weekdayFromYmd(date) });
  }
  if (firstWeekDays.length > 0) {
    weeks.push({ firstDay: rangeStart, days: firstWeekDays });
  }

  // Full Sunday-start weeks.
  let weekStartMs = firstWeekEnd + 86400000; // next Sunday
  while (weekStartMs <= rangeEndMs) {
    const days: ContributionDayNormalized[] = [];
    for (let d = 0; d < 7; d++) {
      const dayMs = weekStartMs + d * 86400000;
      if (dayMs > rangeEndMs) break;
      const date = ymdFromMs(dayMs);
      days.push({ date, count: 0, level: 0, weekday: weekdayFromYmd(date) });
    }
    if (days.length > 0) {
      weeks.push({ firstDay: ymdFromMs(weekStartMs), days });
    }
    weekStartMs += 7 * 86400000;
  }
  return weeks;
}

/** Builds weeks whose firstDay is the Sunday on or before rangeStart, in case GitHub does that. */
function buildSundayAlignedWeeksForRange(
  rangeStart: string,
  rangeEnd: string,
): ContributionWeekNormalized[] {
  const rangeStartMs = parseYmd(rangeStart);
  const rangeEndMs = parseYmd(rangeEnd);
  const startWd = weekdayFromYmd(rangeStart);
  const gridStartMs = rangeStartMs - startWd * 86400000;

  const weeks: ContributionWeekNormalized[] = [];
  let weekStartMs = gridStartMs;

  while (weekStartMs <= rangeEndMs) {
    const days: ContributionDayNormalized[] = [];
    for (let d = 0; d < 7; d++) {
      const dayMs = weekStartMs + d * 86400000;
      if (dayMs < rangeStartMs || dayMs > rangeEndMs) continue;
      const date = ymdFromMs(dayMs);
      days.push({ date, count: 0, level: 0, weekday: weekdayFromYmd(date) });
    }
    if (days.length > 0) {
      weeks.push({ firstDay: ymdFromMs(weekStartMs), days });
    }
    weekStartMs += 7 * 86400000;
  }
  return weeks;
}

function monthsForYear(year: number): ContributionMonthNormalized[] {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return Array.from({ length: 12 }, (_, i) => ({
    firstDay: `${year}-${String(i + 1).padStart(2, "0")}-01`,
    name: names[i],
  }));
}

describe("buildCalendarLayout — no duplicate dates (React keys)", () => {
  it.each([
    ["2022, first day a Saturday", buildWeeksForRange, 2022, false],
    ["2025 with padding days", buildWeeksForRange, 2025, true],
    ["Sunday-aligned weeks with padding days", buildSundayAlignedWeeksForRange, 2025, true],
  ])("%s", (_, weeksFor, year, renderPaddingDays) => {
    const { placedDays } = buildCalendarLayout({
      weeks: weeksFor(`${year}-01-01`, `${year}-12-31`),
      months: monthsForYear(year),
      rangeEndYmd: `${year}-12-31`,
      renderPaddingDays,
    });
    const dates = placedDays.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });
});

describe("buildCalendarLayout — weekday semantics", () => {
  it("2025-01-01 (Wednesday) is placed at row=3", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeEndYmd: "2025-12-31",
    });
    const jan1 = placedDays.find((d) => d.date === "2025-01-01")!;
    expect(jan1).toBeDefined();
    expect(jan1.row).toBe(3);
    expect(jan1.col).toBe(0);
  });

  it("Monday cells match DAY_LABEL_ROWS Mon row", () => {
    const monRow = DAY_LABEL_ROWS.find((r) => r.label === "Mon")!.row;
    const weeks = buildWeeksForRange("2025-01-01", "2025-01-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeEndYmd: "2025-01-31",
    });
    const mondays = placedDays.filter((d) => weekdayFromYmd(d.date) === 1 && !d.isOutOfRange);
    expect(mondays.length).toBeGreaterThan(0);
    for (const mon of mondays) {
      expect(mon.row).toBe(monRow);
    }
  });
});

describe("buildCalendarLayout — padding cells", () => {
  it("renderPaddingDays=false excludes out-of-range days", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: false,
    });
    expect(placedDays.every((d) => !d.isOutOfRange)).toBe(true);
  });

  it("padding fills correct weekday rows for non-Sunday firstDay", () => {
    // 2025-01-01 is Wednesday. First week has Wed(3)-Sat(6).
    // Padding should fill Sun(0), Mon(1), Tue(2) — dates Dec 29, 30, 31.
    const weeks = buildWeeksForRange("2025-01-01", "2025-01-11");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: [],
      rangeEndYmd: "2025-01-11",
      renderPaddingDays: true,
    });
    const oor = placedDays.filter((d) => d.isOutOfRange && d.col === 0);
    expect(oor.length).toBe(3);
    const oorRows = oor.map((d) => d.row).sort();
    expect(oorRows).toEqual([0, 1, 2]); // Sun, Mon, Tue
    expect(oor.map((d) => d.date).sort()).toEqual(["2024-12-29", "2024-12-30", "2024-12-31"]);
  });

  it("renderPaddingDays=true: every week has 7 cells", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays, columnCount } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
    });
    for (let col = 0; col < columnCount; col++) {
      const cellsInCol = placedDays.filter((d) => d.col === col);
      expect(cellsInCol.length).toBe(7);
    }
  });
});

describe("buildCalendarLayout — month labels", () => {
  it("Feb 2025 month label maps to correct week column", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { monthLabels } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeEndYmd: "2025-12-31",
    });
    const feb = monthLabels.find((m) => m.label === "Feb");
    expect(feb).toBeDefined();
    // Feb 1, 2025 is a Saturday, the last day of its week.
    const febWeekIdx = weeks.findIndex((w) => {
      const wStart = parseYmd(w.firstDay);
      const wdOfFirst = weekdayFromYmd(w.firstDay);
      const sundayMs = wStart - wdOfFirst * 86400000;
      const feb1Ms = Date.UTC(2025, 1, 1);
      return feb1Ms >= sundayMs && feb1Ms < sundayMs + 7 * 86400000;
    });
    expect(feb!.colIndex).toBe(febWeekIdx);
  });
});
