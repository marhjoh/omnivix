import { describe, expect, it } from "vitest";
import {
  BANNER_SIZES,
  exportFormatFor,
  exportPixelRatioFor,
  normalizeBannerSize,
  platformOf,
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

describe("shownView", () => {
  it("falls back to the phone view when the format has no such view", () => {
    expect(shownView(BANNER_SIZES.youtube, "tv")).toBe("tv");
    expect(shownView(BANNER_SIZES.reddit, "tv")).toBe("phone");
  });
});

describe("exportFormatFor", () => {
  it("keeps a file format the platform takes", () => {
    expect(exportFormatFor(BANNER_SIZES.wide, "jpeg")).toBe("jpeg");
    expect(exportFormatFor(BANNER_SIZES.wide)).toBe("png");
  });

  it("uses the platform's own when it doesn't take the chosen one", () => {
    expect(exportFormatFor(BANNER_SIZES.reddit, "png")).toBe("jpeg");
    expect(exportFormatFor(BANNER_SIZES.reddit)).toBe("jpeg");
  });
});

describe("exportPixelRatioFor", () => {
  it("keeps a ratio the format takes", () => {
    expect(exportPixelRatioFor(BANNER_SIZES.wide, "png", 2)).toBe(2);
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "jpeg", 1)).toBe(1);
  });

  it("lowers it to the format's largest ratio for the file format", () => {
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "png", 3)).toBe(1);
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "jpeg", 3)).toBe(1);
    expect(exportPixelRatioFor(BANNER_SIZES.youtube, "png")).toBe(1);
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
