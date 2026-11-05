import { describe, expect, it } from "vitest";
import { changeOf, chartPoints, durationPercentile } from "./summary";

const days = (counts: number[]) =>
  counts.map((exports, index) => ({
    day: `2026-01-${String(index + 1).padStart(2, "0")}`,
    counts: { exports },
  }));

describe("changeOf", () => {
  it("gives a percentage only when the earlier count is big enough", () => {
    expect(changeOf(30, 20)).toEqual({ difference: 10, percent: 50 });
    expect(changeOf(5, 2)).toEqual({ difference: 3, percent: null });
    expect(changeOf(0, 0)).toEqual({ difference: 0, percent: null });
  });
});

describe("chartPoints", () => {
  it("pairs each day with the same day of the period before", () => {
    const stats = days([1, 2, 3, 4, 5, 6]);
    const { points, daysPerPoint } = chartPoints(stats.slice(3), stats.slice(0, 3), "exports");
    expect(daysPerPoint).toBe(1);
    expect(points).toEqual([
      { day: "2026-01-04", value: 4, previous: 1 },
      { day: "2026-01-05", value: 5, previous: 2 },
      { day: "2026-01-06", value: 6, previous: 3 },
    ]);
  });

  it("adds up weeks for long periods, ending today", () => {
    const stats = days(Array.from({ length: 200 }, () => 1)).map((day, index) => ({
      ...day,
      day: String(index),
    }));
    const { points, daysPerPoint } = chartPoints(stats.slice(100), stats.slice(0, 100), "exports");
    expect(daysPerPoint).toBe(7);
    expect(points).toHaveLength(15);
    expect(points[0]).toMatchObject({ day: "100", value: 2, previous: 2 });
    expect(points.at(-1)).toMatchObject({ day: "193", value: 7 });
  });
});

describe("durationPercentile", () => {
  it("returns the end of the bucket that reaches the share", () => {
    const totals = { "exports:seconds:6": 5, "exports:seconds:8": 4, "exports:seconds:20": 1 };
    expect(durationPercentile(totals, 0.5)).toBe(6);
    expect(durationPercentile(totals, 0.9)).toBe(8);
    expect(durationPercentile(totals, 0.95)).toBe(20);
    expect(durationPercentile({}, 0.5)).toBeNull();
  });
});
