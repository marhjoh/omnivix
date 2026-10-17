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
