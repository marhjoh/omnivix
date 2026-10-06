import { describe, expect, it } from "vitest";
import { exportBlockedReason } from "./exportBlockedReason";

describe("exportBlockedReason", () => {
  const base = { templateId: "github-banner" as const, stateValid: true };

  it("allows export when the preview is ready and state is valid", () => {
    expect(exportBlockedReason({ ...base, previewState: "ready" })).toBeNull();
  });

  it("blocks while preview data is loading", () => {
    expect(exportBlockedReason({ ...base, previewState: "loading" })).toBe(
      "Waiting for preview data…",
    );
  });

  it("blocks when preview data failed", () => {
    expect(exportBlockedReason({ ...base, previewState: "error" })).toBe(
      "Preview data failed to load",
    );
  });

  it("uses the empty-state title for the template", () => {
    expect(exportBlockedReason({ ...base, previewState: "empty" })).toBe(
      "Choose a GitHub profile",
    );
    expect(
      exportBlockedReason({ ...base, templateId: "quote-banner", previewState: "empty" }),
    ).toBe("Add your quote");
  });

  it("prefers the preview reason over invalid state", () => {
    expect(
      exportBlockedReason({ ...base, previewState: "empty", stateValid: false }),
    ).toBe("Choose a GitHub profile");
  });

  it("blocks when state is invalid and the preview is ready", () => {
    expect(
      exportBlockedReason({ ...base, previewState: "ready", stateValid: false }),
    ).toBe("Some settings are invalid");
  });
});
