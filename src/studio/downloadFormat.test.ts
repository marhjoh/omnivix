import { describe, expect, it } from "vitest";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { shownDownloadFormat } from "./downloadFormat";

describe("shownDownloadFormat", () => {
  it("keeps the choice when the size takes PNG", () => {
    expect(shownDownloadFormat(BANNER_SIZES.wide, "transparent")).toBe("transparent");
    expect(shownDownloadFormat(BANNER_SIZES.wide, "jpeg")).toBe("jpeg");
  });

  it("falls back to JPEG for a size that only takes JPEG", () => {
    expect(shownDownloadFormat(BANNER_SIZES.reddit, "transparent")).toBe("jpeg");
    expect(shownDownloadFormat(BANNER_SIZES.reddit, "png")).toBe("jpeg");
  });
});
