import { describe, expect, it } from "vitest";
import { contributionRange } from "./utcContributionRange";

const DAY_MS = 86_400_000;

describe("contributionRange", () => {
  it("covers a whole calendar year", () => {
    expect(contributionRange("2024")).toEqual({
      from: "2024-01-01T00:00:00Z",
      to: "2024-12-31T23:59:59Z",
    });
  });

  it("spans exactly 365 inclusive UTC calendar days for latest", () => {
    const { from, to } = contributionRange("latest", new Date(Date.UTC(2026, 3, 3, 15, 30, 0)));
    expect(from.slice(0, 10)).toBe("2025-04-04");
    expect(to.slice(0, 10)).toBe("2026-04-03");
    expect((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY_MS + 1).toBe(365);
  });

  it("is stable for times within the same UTC day", () => {
    const a = contributionRange("latest", new Date(Date.UTC(2024, 5, 10, 0, 0, 1)));
    const b = contributionRange("latest", new Date(Date.UTC(2024, 5, 10, 23, 59, 59)));
    expect(a).toEqual(b);
  });
});
