import { describe, expect, it } from "vitest";
import { previewScale } from "./previewScale";

const linkedin = { width: 1584, height: 396 };

describe("previewScale", () => {
  it("never upscales", () => {
    expect(previewScale({ width: 4000, height: 2000 }, linkedin)).toBe(1);
  });

  it("returns 0 for a collapsed area", () => {
    expect(previewScale({ width: 0, height: 300 }, linkedin)).toBe(0);
  });
});
