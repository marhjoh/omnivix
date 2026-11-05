import { describe, expect, it } from "vitest";
import { clamp } from "./math";

describe("clamp", () => {
  it.each([
    [-1, 0],
    [0.5, 0.5],
    [2, 1],
  ])("keeps %d between 0 and 1", (value, expected) => {
    expect(clamp(value, 0, 1)).toBe(expected);
  });
});
