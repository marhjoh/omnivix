import { describe, expect, it } from "vitest";
import {
  computeLatestContributionRangeUtc,
  isLeapYear,
  listInclusiveUtcCalendarDays,
  listUtcCalendarYearDays,
} from "./utcContributionRange";

/** Product contract: explicit 365-day latest + full calendar YYYY. */

describe("computeLatestContributionRangeUtc", () => {
  it("spans exactly 365 inclusive UTC calendar days", () => {
    const anchor = new Date(Date.UTC(2026, 3, 3, 15, 30, 0));
    const r = computeLatestContributionRangeUtc(anchor);
    const days = listInclusiveUtcCalendarDays(r.fromIso.slice(0, 10), r.toIso.slice(0, 10));
    expect(days).toHaveLength(365);
    expect(days[0]).toBe("2025-04-04");
    expect(days[364]).toBe("2026-04-03");
  });

  it("exposes toYyyyMmDd matching anchor UTC date for cache keys", () => {
    const anchor = new Date(Date.UTC(2026, 0, 15, 23, 59, 0));
    const r = computeLatestContributionRangeUtc(anchor);
    expect(r.toYyyyMmDd).toBe("2026-01-15");
  });

  it("is stable for anchor times within the same UTC day", () => {
    const a = computeLatestContributionRangeUtc(new Date(Date.UTC(2024, 5, 10, 0, 0, 1)));
    const b = computeLatestContributionRangeUtc(new Date(Date.UTC(2024, 5, 10, 23, 59, 59)));
    expect(a.fromIso).toBe(b.fromIso);
    expect(a.toIso).toBe(b.toIso);
  });
});

describe("listUtcCalendarYearDays", () => {
  it("returns 365 days for a non-leap year", () => {
    const d = listUtcCalendarYearDays(2023);
    expect(d).toHaveLength(365);
    expect(d[0]).toBe("2023-01-01");
    expect(d[364]).toBe("2023-12-31");
  });

  it("returns 366 days for a leap year", () => {
    const d = listUtcCalendarYearDays(2024);
    expect(d).toHaveLength(366);
    expect(d[59]).toBe("2024-02-29");
  });
});

describe("listInclusiveUtcCalendarDays", () => {
  it("supports arbitrary ranges", () => {
    const d = listInclusiveUtcCalendarDays("2024-01-01", "2024-01-10");
    expect(d).toHaveLength(10);
  });
});

describe("isLeapYear", () => {
  it("matches calendar rules", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });
});
