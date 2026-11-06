import { describe, expect, it } from "vitest";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { shownDownloadFormat } from "./downloadFormat";

describe("shownDownloadFormat", () => {
  it("keeps the choice when the banner can take it", () => {
    expect(shownDownloadFormat(BANNER_SIZES.wide, "transparent", false)).toBe("transparent");
    expect(shownDownloadFormat(BANNER_SIZES.wide, "jpeg", true)).toBe("jpeg");
  });

  it("falls back to JPEG for a size that only takes JPEG", () => {
    expect(shownDownloadFormat(BANNER_SIZES.reddit, "transparent", false)).toBe("jpeg");
    expect(shownDownloadFormat(BANNER_SIZES.reddit, "png", false)).toBe("jpeg");
  });

  it("falls back to PNG when a background image is picked", () => {
    expect(shownDownloadFormat(BANNER_SIZES.wide, "transparent", true)).toBe("png");
  });
});
