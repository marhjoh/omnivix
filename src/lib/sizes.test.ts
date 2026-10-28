import { describe, expect, it } from "vitest";
import {
  BANNER_SIZES,
  exportPixelRatioFor,
  exportPixelRatios,
  normalizeBannerSize,
  viewRect,
} from "./sizes";

describe("normalizeBannerSize", () => {
  it("keeps valid formats", () => {
    expect(normalizeBannerSize("card")).toBe("card");
  });

  it("falls back for unknown values", () => {
    expect(normalizeBannerSize("square")).toBe("wide");
    expect(normalizeBannerSize(undefined, "header")).toBe("header");
  });
});

describe("viewRect", () => {
  it("is the whole banner for a format every device shows in full", () => {
    expect(viewRect(BANNER_SIZES.wide, "phone")).toEqual({
      left: 0,
      top: 0,
      width: 1584,
      height: 396,
    });
  });

  it("centers a cropped view in the banner", () => {
    expect(viewRect(BANNER_SIZES.youtube, "phone")).toEqual({
      left: 507,
      top: 509,
      width: 1546,
      height: 423,
    });
    expect(viewRect(BANNER_SIZES.youtube, "desktop")).toMatchObject({ left: 0, width: 2560 });
    expect(viewRect(BANNER_SIZES.youtube, "tv")).toEqual({
      left: 0,
      top: 0,
      width: 2560,
      height: 1440,
    });
  });
});

describe("exportPixelRatios", () => {
  it("lists every ratio the format takes in the file format", () => {
    expect(exportPixelRatios(BANNER_SIZES.wide, "png")).toEqual([1, 2, 3]);
    expect(exportPixelRatios(BANNER_SIZES.youtube, "png")).toEqual([1, 2]);
    expect(exportPixelRatios(BANNER_SIZES.youtube, "jpeg")).toEqual([1, 2, 3]);
  });
});

describe("exportPixelRatioFor", () => {
  it("keeps a ratio the format takes", () => {
    expect(exportPixelRatioFor(BANNER_SIZES.wide, "png", 2)).toBe(2);
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "jpeg", 3)).toBe(3);
  });

  it("lowers it to the format's largest ratio for the file format", () => {
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "png", 3)).toBe(2);
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "png")).toBe(2);
    expect(exportPixelRatioFor(BANNER_SIZES.wide, "png")).toBe(3);
  });
});
