import { describe, expect, it } from "vitest";
import { fitScale } from "./fitScale";

const linkedin = { width: 1584, height: 396 };

describe("fitScale", () => {
  it("is limited by width in a wide-enough but narrow area", () => {
    expect(fitScale({ width: 792, height: 800 }, linkedin)).toBe(0.5);
  });

  it("is limited by height in a short, wide area", () => {
    expect(fitScale({ width: 1500, height: 198 }, linkedin)).toBe(0.5);
  });

  it("never upscales", () => {
    expect(fitScale({ width: 4000, height: 2000 }, linkedin)).toBe(1);
  });

  it("returns 0 for a collapsed area", () => {
    expect(fitScale({ width: 0, height: 300 }, linkedin)).toBe(0);
    expect(fitScale({ width: -10, height: 300 }, linkedin)).toBe(0);
  });

  it("returns 1 for empty content", () => {
    expect(fitScale({ width: 300, height: 300 }, { width: 0, height: 0 })).toBe(1);
  });
});
