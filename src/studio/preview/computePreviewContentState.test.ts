import { describe, expect, it } from "vitest";
import { computePreviewContentState } from "./computePreviewContentState";

describe("computePreviewContentState", () => {
  const base = {
    templateId: "github-banner" as const,
    needsUsername: true,
    username: "octocat",
    quoteText: "",
    dataError: null as string | null,
    dataReady: false,
  };

  it("returns loading before hydration", () => {
    expect(
      computePreviewContentState({ ...base, hydrated: false, dataReady: false }),
    ).toBe("loading");
  });

  it("returns empty when username required but missing", () => {
    expect(
      computePreviewContentState({
        ...base,
        hydrated: true,
        username: "  ",
        dataReady: true,
      }),
    ).toBe("empty");
  });

  it("returns error when dataError set", () => {
    expect(
      computePreviewContentState({
        ...base,
        hydrated: true,
        dataError: "Network error",
        dataReady: false,
      }),
    ).toBe("error");
  });

  it("returns loading when username set but data not ready", () => {
    expect(
      computePreviewContentState({ ...base, hydrated: true, dataReady: false }),
    ).toBe("loading");
  });

  it("returns ready when data ready", () => {
    expect(
      computePreviewContentState({ ...base, hydrated: true, dataReady: true }),
    ).toBe("ready");
  });

  it("quote-banner empty when quote trimmed empty", () => {
    expect(
      computePreviewContentState({
        ...base,
        templateId: "quote-banner",
        needsUsername: false,
        username: "",
        quoteText: "   ",
        dataReady: true,
        hydrated: true,
      }),
    ).toBe("empty");
  });
});
