import { describe, expect, it } from "vitest";
import { exportRequestSchema, parseExportRequest } from "./payload";

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

describe("parseExportRequest", () => {
  it("fills in the template's defaults, so a caller only sends what it changes", () => {
    const result = parseExportRequest({
      templateId: "quote-banner",
      size: "header",
      state: { quote: "Hi" },
    });
    expect(result.ok && result.request.state).toMatchObject({
      quote: "Hi",
      author: "Omnivix",
      alignment: "center",
      themeId: "default",
      size: "header",
    });
  });

  it("names each field that failed", () => {
    const result = parseExportRequest({
      templateId: "quote-banner",
      size: "wide",
      state: { quote: "x".repeat(1000), alignment: "diagonal" },
    });
    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual([
      "state.quote",
      "state.alignment",
    ]);
  });

  it("requires the username for GitHub banners", () => {
    const result = parseExportRequest({ templateId: "github-banner", size: "wide", state: {} });
    expect(!result.ok && result.issues).toEqual([{ path: "state.username", message: "Required" }]);
  });

  it("only accepts the real themes", () => {
    const result = parseExportRequest({
      templateId: "quote-banner",
      size: "wide",
      state: { themeId: "neon" },
    });
    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual(["state.themeId"]);
  });

  it("checks the request's own fields first", () => {
    const result = parseExportRequest({ templateId: "quote-banner", size: "huge", state: {} });
    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual(["size"]);
  });

  it("reports a body that isn't an object", () => {
    const result = parseExportRequest(null);
    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual(["request"]);
  });

  it("doesn't echo values back", () => {
    const secret = "do-not-echo-this-value";
    const result = parseExportRequest({
      templateId: "quote-banner",
      size: "wide",
      state: { alignment: secret },
    });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
