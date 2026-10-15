import { describe, expect, it } from "vitest";
import { computeLatestContributionRangeUtc } from "./utcContributionRange";

const DAY_MS = 86_400_000;

/** Product contract: explicit 365-day latest + full calendar YYYY. */

describe("computeLatestContributionRangeUtc", () => {
  it("spans exactly 365 inclusive UTC calendar days", () => {
    const anchor = new Date(Date.UTC(2026, 3, 3, 15, 30, 0));
    const r = computeLatestContributionRangeUtc(anchor);
    expect(r.fromIso.slice(0, 10)).toBe("2025-04-04");
    expect(r.toIso.slice(0, 10)).toBe("2026-04-03");
    const days =
      (Date.parse(r.toIso.slice(0, 10)) - Date.parse(r.fromIso.slice(0, 10))) / DAY_MS + 1;
    expect(days).toBe(365);
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
