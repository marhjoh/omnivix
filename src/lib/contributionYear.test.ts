import { afterEach, describe, expect, it, vi } from "vitest";
import { contributionYear, isContributionYear, LATEST_YEAR } from "./contributionYear";

describe("isContributionYear", () => {
  it.each([LATEST_YEAR, "2024"])("accepts %s", (year) => {
    expect(isContributionYear(year)).toBe(true);
  });

  it.each(["", "24", "20245", "last"])("rejects %j", (year) => {
    expect(isContributionYear(year)).toBe(false);
  });
});

describe("contributionYear", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps a set year", () => {
    expect(contributionYear("2024")).toBe("2024");
    expect(contributionYear(LATEST_YEAR)).toBe(LATEST_YEAR);
  });

  it("defaults to the current UTC year", () => {
    // Still December 31 in the Americas, already January 1 in UTC.
    vi.useFakeTimers({ now: Date.UTC(2027, 0, 1, 2) });
    expect(contributionYear(undefined)).toBe("2027");
    expect(contributionYear("")).toBe("2027");
  });
});
