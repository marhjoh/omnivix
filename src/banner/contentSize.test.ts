import { describe, expect, it } from "vitest";
import { normalizeContentSize, normalizeContentSizeOrFill } from "./contentSize";

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
