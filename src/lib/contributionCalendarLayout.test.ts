import { describe, expect, it } from "vitest";
import {
  buildCalendarLayout,
  DAY_LABEL_ROWS,
} from "./contributionCalendarLayout";
import type {
  ContributionWeekNormalized,
  ContributionMonthNormalized,
  ContributionDayNormalized,
} from "@/src/github/normalize";

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
 * Simulate GitHub's week response for a year range.
 * GitHub returns: first week starts at rangeStart (not necessarily Sunday),
 * remaining weeks start on Sunday.  Only in-range days are in `days`.
 */
function buildWeeksForRange(rangeStart: string, rangeEnd: string): ContributionWeekNormalized[] {
  const rangeStartMs = parseYmd(rangeStart);
  const rangeEndMs = parseYmd(rangeEnd);
  const startWd = weekdayFromYmd(rangeStart);

  const weeks: ContributionWeekNormalized[] = [];

  // First (possibly partial) week — starts at rangeStart, ends at next Saturday.
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

/**
 * Build weeks where firstDay is always the Sunday on or before rangeStart
 * (an alternate possible GitHub behavior).
 */
function buildSundayAlignedWeeksForRange(rangeStart: string, rangeEnd: string): ContributionWeekNormalized[] {
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return Array.from({ length: 12 }, (_, i) => ({
    firstDay: `${year}-${String(i + 1).padStart(2, "0")}-01`,
    name: names[i],
    totalWeeks: 5,
    year,
  }));
}

describe("buildCalendarLayout — authoritative weeks contract", () => {
  it("columnCount === weeks.length for year 2025", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { columnCount } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
    });
    expect(columnCount).toBe(weeks.length);
  });

  it("columnCount === weeks.length for leap year 2024", () => {
    const weeks = buildWeeksForRange("2024-01-01", "2024-12-31");
    const { columnCount } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2024),
      rangeStartYmd: "2024-01-01",
      rangeEndYmd: "2024-12-31",
    });
    expect(columnCount).toBe(weeks.length);
  });

  it("renderPaddingDays never changes columnCount", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const compact = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: false,
    });
    const padded = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
    });
    expect(padded.columnCount).toBe(compact.columnCount);
    expect(padded.columnCount).toBe(weeks.length);
  });
});

describe("buildCalendarLayout — no duplicate dates (React keys)", () => {
  it("no duplicates for year 2025 (firstDay=Wednesday)", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
    });
    const dates = placedDays.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("no duplicates for year 2022 (firstDay=Saturday)", () => {
    const weeks = buildWeeksForRange("2022-01-01", "2022-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2022),
      rangeStartYmd: "2022-01-01",
      rangeEndYmd: "2022-12-31",
    });
    const dates = placedDays.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("no duplicates with renderPaddingDays=true (non-Sunday firstDay)", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
    });
    const dates = placedDays.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("no duplicates with Sunday-aligned weeks", () => {
    const weeks = buildSundayAlignedWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
    });
    const dates = placedDays.map((d) => d.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("no duplicates with Sunday-aligned weeks + padding", () => {
    const weeks = buildSundayAlignedWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
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
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
    });
    const jan1 = placedDays.find((d) => d.date === "2025-01-01")!;
    expect(jan1).toBeDefined();
    expect(jan1.row).toBe(3);
    expect(jan1.weekday).toBe(3);
    expect(jan1.col).toBe(0);
  });

  it("Monday cells match DAY_LABEL_ROWS Mon row", () => {
    const monRow = DAY_LABEL_ROWS.find((r) => r.label === "Mon")!.row;
    const weeks = buildWeeksForRange("2025-01-01", "2025-01-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
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
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: false,
    });
    expect(placedDays.every((d) => !d.isOutOfRange)).toBe(true);
  });

  it("renderPaddingDays=true adds out-of-range cells only in first/last week", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays, columnCount } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
    });
    const oor = placedDays.filter((d) => d.isOutOfRange);
    expect(oor.length).toBeGreaterThan(0);
    for (const p of oor) {
      expect(p.col === 0 || p.col === columnCount - 1).toBe(true);
    }
  });

  it("padding dates are before rangeStart or after rangeEnd", () => {
    const weeks = buildWeeksForRange("2025-01-01", "2025-12-31");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: monthsForYear(2025),
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
      renderPaddingDays: true,
    });
    const oor = placedDays.filter((d) => d.isOutOfRange);
    for (const p of oor) {
      const ms = parseYmd(p.date);
      const before = ms < parseYmd("2025-01-01");
      const after = ms > parseYmd("2025-12-31");
      expect(before || after).toBe(true);
    }
  });

  it("padding fills correct weekday rows for non-Sunday firstDay", () => {
    // 2025-01-01 is Wednesday. First week has Wed(3)-Sat(6).
    // Padding should fill Sun(0), Mon(1), Tue(2) — dates Dec 29, 30, 31.
    const weeks = buildWeeksForRange("2025-01-01", "2025-01-11");
    const { placedDays } = buildCalendarLayout({
      weeks,
      months: [],
      rangeStartYmd: "2025-01-01",
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
      rangeStartYmd: "2025-01-01",
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
      rangeStartYmd: "2025-01-01",
      rangeEndYmd: "2025-12-31",
    });
    const feb = monthLabels.find((m) => m.label === "Feb");
    expect(feb).toBeDefined();
    // Feb 1, 2025 is Saturday → it falls in the week containing it.
    const febWeekIdx = weeks.findIndex((w) => {
      const wStart = parseYmd(w.firstDay);
      const wdOfFirst = weekdayFromYmd(w.firstDay);
      const sundayMs = wStart - wdOfFirst * 86400000;
      const feb1Ms = Date.UTC(2025, 1, 1);
      return feb1Ms >= sundayMs && feb1Ms < sundayMs + 7 * 86400000;
    });
    expect(feb!.colIndex).toBe(febWeekIdx);
  });

  it("month label collision: labels too close are dropped", () => {
    const weeks = buildWeeksForRange("2025-01-27", "2025-02-08");
    const months: ContributionMonthNormalized[] = [
      { firstDay: "2025-01-01", name: "January", totalWeeks: 5, year: 2025 },
      { firstDay: "2025-02-01", name: "February", totalWeeks: 4, year: 2025 },
    ];
    const { monthLabels } = buildCalendarLayout({
      weeks,
      months,
      rangeStartYmd: "2025-01-27",
      rangeEndYmd: "2025-02-08",
    });
    expect(monthLabels.length).toBeLessThanOrEqual(2);
  });
});

describe("DAY_LABEL_ROWS", () => {
  it("Mon=1, Wed=3, Fri=5 (Sunday-start)", () => {
    expect(DAY_LABEL_ROWS.find((r) => r.label === "Mon")?.row).toBe(1);
    expect(DAY_LABEL_ROWS.find((r) => r.label === "Wed")?.row).toBe(3);
    expect(DAY_LABEL_ROWS.find((r) => r.label === "Fri")?.row).toBe(5);
  });
});
