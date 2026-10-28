import { describe, expect, it } from "vitest";
import {
  BANNER_SIZES,
  bannerViews,
  exportPixelRatioFor,
  exportPixelRatios,
  normalizeBannerSize,
  platformOf,
  safeAreaOf,
  sizeOfPlatform,
  shownView,
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

describe("positioned views", () => {
  it("keeps a view's own place on the axes it sets", () => {
    // Reddit's desktop cuts the top tenth, so it's not centered vertically.
    expect(viewRect(BANNER_SIZES.reddit, "desktop")).toEqual({
      left: 0,
      top: 100,
      width: 3000,
      height: 900,
    });
  });
});

describe("bannerViews", () => {
  it("lists the views the format has", () => {
    expect(bannerViews(BANNER_SIZES.wide)).toEqual([]);
    expect(bannerViews(BANNER_SIZES.youtube)).toEqual(["phone", "desktop", "tv"]);
    expect(bannerViews(BANNER_SIZES.reddit)).toEqual(["phone", "desktop"]);
  });
});

describe("shownView", () => {
  it("falls back to the phone view when the format has no such view", () => {
    expect(shownView(BANNER_SIZES.youtube, "tv")).toBe("tv");
    expect(shownView(BANNER_SIZES.reddit, "tv")).toBe("phone");
  });
});

describe("safeAreaOf", () => {
  it("is the phone view unless the format sets its own", () => {
    expect(safeAreaOf(BANNER_SIZES.youtube)).toEqual(viewRect(BANNER_SIZES.youtube, "phone"));
    expect(safeAreaOf(BANNER_SIZES.reddit)).toEqual({
      left: 750,
      top: 333,
      width: 1500,
      height: 417,
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

describe("sizeOfPlatform", () => {
  it("is the format the platform's banners use", () => {
    expect(sizeOfPlatform("bluesky")).toBe("header");
    expect(sizeOfPlatform("reddit")).toBe("reddit");
    expect(sizeOfPlatform("myspace")).toBeUndefined();
  });
});

describe("platformOf", () => {
  it("keeps a platform from the banner's format", () => {
    expect(platformOf({ size: "header", platform: "bluesky" }).name).toBe("Bluesky");
  });

  it("falls back to the format's first platform", () => {
    expect(platformOf({ size: "header" }).id).toBe("x");
    // A saved platform from another format, e.g. after a link set `size`.
    expect(platformOf({ size: "wide", platform: "bluesky" }).id).toBe("linkedin");
  });
});
