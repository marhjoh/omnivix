import { describe, expect, it } from "vitest";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { contentBox, fitScale } from "./fit";

describe("contentBox", () => {
  it("insets every side by a share of the banner height", () => {
    expect(contentBox({ width: 1500, height: 500 })).toEqual({
      left: 40,
      top: 40,
      width: 1420,
      height: 420,
    });
  });

  it("is inside Reddit's safe area, clear of the app's buttons, avatar and fade", () => {
    // 1040 × 460 at x 1190, y 390, less 37px on each side.
    expect(contentBox(BANNER_SIZES.reddit)).toEqual({
      left: 1227,
      top: 427,
      width: 966,
      height: 386,
    });
  });

  it("is inside the part every device shows, when devices crop the banner", () => {
    // YouTube's 1546 × 423 phone view, centered in 2560 × 1440, less 34px on each side.
    expect(contentBox(BANNER_SIZES.youtube)).toEqual({
      left: 541,
      top: 543,
      width: 1478,
      height: 355,
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
