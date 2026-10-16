import { describe, expect, it } from "vitest";
import { isExportBlocked } from "./exportBlocked";

describe("isExportBlocked", () => {
  const ready = {
    previewState: "ready" as const,
    stateValid: true,
    backgroundFailed: false,
    previewPending: false,
  };

  it("allows export when the preview is ready and nothing is wrong", () => {
    expect(isExportBlocked(ready)).toBe(false);
  });

  it.each(["loading", "empty", "error"] as const)("blocks while the preview is %s", (state) => {
    expect(isExportBlocked({ ...ready, previewState: state })).toBe(true);
  });

  it("blocks when state is invalid", () => {
    expect(isExportBlocked({ ...ready, stateValid: false })).toBe(true);
  });

  it("blocks when the background image failed to load", () => {
    expect(isExportBlocked({ ...ready, backgroundFailed: true })).toBe(true);
  });

  it("blocks while the preview still shows an earlier version", () => {
    expect(isExportBlocked({ ...ready, previewPending: true })).toBe(true);
  });
});
