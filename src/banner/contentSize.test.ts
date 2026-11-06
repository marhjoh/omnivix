import { describe, expect, it } from "vitest";
import { normalizeContentSize, normalizeContentSizeOrFill } from "./contentSize";

describe("normalizeContentSize", () => {
  it("falls back for unknown values", () => {
    expect(normalizeContentSize(undefined)).toBe("l");
    expect(normalizeContentSize("huge", "m")).toBe("m");
  });

  it("allows Fill only where asked", () => {
    expect(normalizeContentSizeOrFill("fill")).toBe("fill");
    expect(normalizeContentSize("fill")).toBe("l");
  });
});
