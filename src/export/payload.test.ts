import { describe, expect, it } from "vitest";
import { exportRequestSchema } from "./payload";

const request = { templateId: "quote-banner", size: "wide", state: {} };

describe("exportRequestSchema pixelRatio", () => {
  it.each([1, 2, 3, undefined])("accepts %s", (pixelRatio) => {
    expect(exportRequestSchema.safeParse({ ...request, pixelRatio }).success).toBe(true);
  });

  it.each([0, 4, 2.5, "2"])("rejects %s", (pixelRatio) => {
    expect(exportRequestSchema.safeParse({ ...request, pixelRatio }).success).toBe(false);
  });
});

describe("exportRequestSchema format", () => {
  it.each(["png", "jpeg", undefined])("accepts %s", (format) => {
    expect(exportRequestSchema.safeParse({ ...request, format }).success).toBe(true);
  });

  it.each(["jpg", "webp", "PNG", 1])("rejects %s", (format) => {
    expect(exportRequestSchema.safeParse({ ...request, format }).success).toBe(false);
  });
});
