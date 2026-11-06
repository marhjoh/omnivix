import { describe, expect, it } from "vitest";
import { parseExportRequest } from "./payload";

const request = { templateId: "quote-banner", size: "wide", state: {} };

describe("parseExportRequest", () => {
  it("rejects a pixel ratio the size can't be exported at in that file format", () => {
    const youtube = { ...request, size: "youtube" };
    expect(parseExportRequest({ ...youtube, pixelRatio: 2 })).toEqual({
      ok: false,
      issues: [{ path: "pixelRatio", message: 'Must be 1 for size "youtube" with format "png"' }],
    });
    expect(parseExportRequest({ ...youtube, pixelRatio: 3, format: "jpeg" })).toEqual({
      ok: false,
      issues: [{ path: "pixelRatio", message: 'Must be 1 for size "youtube" with format "jpeg"' }],
    });
    expect(parseExportRequest({ ...youtube, pixelRatio: 1 }).ok).toBe(true);
    expect(parseExportRequest(youtube).ok).toBe(true);
  });

  it("rejects a file format the size can't be exported as", () => {
    expect(parseExportRequest({ ...request, size: "reddit", format: "png" })).toEqual({
      ok: false,
      issues: [{ path: "format", message: 'Must be "jpeg" for size "reddit"' }],
    });
  });

  it("takes a transparent background for PNG only", () => {
    const transparent = parseExportRequest({ ...request, background: "transparent" });
    expect(transparent.ok && transparent.request.background).toBe("transparent");
    const issue = (format: string) => ({
      path: "background",
      message: `Must be left out for format "${format}", which has no transparency`,
    });
    expect(parseExportRequest({ ...request, format: "jpeg", background: "transparent" })).toEqual({
      ok: false,
      issues: [issue("jpeg")],
    });
    expect(parseExportRequest({ ...request, size: "reddit", background: "transparent" })).toEqual({
      ok: false,
      issues: [issue("jpeg")],
    });
  });

  it("uses the size's own file format when none is sent", () => {
    const reddit = parseExportRequest({ ...request, size: "reddit" });
    expect(reddit.ok && reddit.request.format).toBe("jpeg");
    const wide = parseExportRequest(request);
    expect(wide.ok && wide.request.format).toBe("png");
  });

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
      "state.alignment",
      "state.quote",
    ]);
  });

  it("requires the username for GitHub banners", () => {
    const result = parseExportRequest({ templateId: "github-banner", size: "wide", state: {} });
    expect(!result.ok && result.issues).toEqual([{ path: "state.username", message: "Required" }]);
  });

  it("only accepts the real grid colors", () => {
    const result = parseExportRequest({
      templateId: "contribution-banner",
      size: "wide",
      state: { username: "marhjoh", themeId: "neon" },
    });
    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual(["state.themeId"]);
  });

  it("ignores grid colors on banners without a grid", () => {
    const result = parseExportRequest({
      templateId: "quote-banner",
      size: "wide",
      state: { themeId: "neon" },
    });
    expect(result.ok).toBe(true);
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

describe("parseExportRequest year", () => {
  const contributions = { templateId: "contribution-banner", size: "wide" };

  it.each(["2024", "latest"])("accepts %s", (year) => {
    expect(parseExportRequest({ ...contributions, state: { username: "x", year } }).ok).toBe(true);
  });

  it("rejects a year that isn't four digits or latest, instead of failing the render", () => {
    const result = parseExportRequest({ ...contributions, state: { username: "x", year: "abc" } });
    expect(result).toMatchObject({ ok: false, issues: [{ path: "state.year" }] });
  });
});
