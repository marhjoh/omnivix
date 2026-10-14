import { describe, expect, it } from "vitest";
import {
  CONTENT_SIZE_FACTOR,
  normalizeContentSize,
  normalizeContentSizeOrFill,
} from "./contentSize";

describe("normalizeContentSize", () => {
  it("keeps XS–XL", () => {
    expect(normalizeContentSize("xs")).toBe("xs");
    expect(normalizeContentSize("xl")).toBe("xl");
  });

  it("falls back for unknown values", () => {
    expect(normalizeContentSize(undefined)).toBe("l");
    expect(normalizeContentSize("huge", "m")).toBe("m");
  });

  it("allows Fill only where asked", () => {
    expect(normalizeContentSizeOrFill("fill")).toBe("fill");
    expect(normalizeContentSize("fill")).toBe("l");
  });
});

describe("CONTENT_SIZE_FACTOR", () => {
  it("makes each step 80% of the one above, with XL filling the banner", () => {
    expect(CONTENT_SIZE_FACTOR.xl).toBe(1);
    expect(CONTENT_SIZE_FACTOR.l).toBeCloseTo(0.8);
    expect(CONTENT_SIZE_FACTOR.xs).toBeCloseTo(0.4096);
  });
});
