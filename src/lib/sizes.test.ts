import { describe, expect, it } from "vitest";
import { normalizeBannerSize } from "./sizes";

describe("normalizeBannerSize", () => {
  it("keeps valid formats", () => {
    expect(normalizeBannerSize("card")).toBe("card");
  });

  it("falls back for unknown values", () => {
    expect(normalizeBannerSize("square")).toBe("wide");
    expect(normalizeBannerSize(undefined, "header")).toBe("header");
  });
});
