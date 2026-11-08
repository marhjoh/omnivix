import { describe, expect, it } from "vitest";
import { formatDayRange } from "./dateRange";

describe("formatDayRange", () => {
  it.each([
    ["2026-10-05", "2026-11-08", "Oct 5 – Nov 8, 2026"],
    ["2025-11-08", "2026-11-07", "Nov 8, 2025 – Nov 7, 2026"],
    ["2026-10-01", "2026-10-01", "Oct 1, 2026"],
  ])("formats %s to %s", (first, last, text) => {
    // Plain spaces around the dash, the same in Node and every browser.
    expect(formatDayRange(first, last)).toBe(text);
  });
});
