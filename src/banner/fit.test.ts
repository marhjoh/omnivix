import { describe, expect, it } from "vitest";
import { contentBox, fitScale } from "./fit";

describe("contentBox", () => {
  it("insets every side by a share of the banner height", () => {
    expect(contentBox({ width: 1500, height: 500 })).toEqual({
      inset: 40,
      width: 1420,
      height: 420,
    });
  });
});

describe("fitScale", () => {
  it("is limited by whichever side runs out first", () => {
    expect(fitScale({ width: 1000, height: 300 }, { width: 500, height: 100 })).toBe(2);
    expect(fitScale({ width: 1000, height: 300 }, { width: 200, height: 150 })).toBe(2);
  });

  it("shrinks content larger than the box", () => {
    expect(fitScale({ width: 400, height: 100 }, { width: 800, height: 100 })).toBe(0.5);
  });
});
