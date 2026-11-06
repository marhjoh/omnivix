import { describe, expect, it } from "vitest";
import { computePreviewContentState, previewLoadingMessage } from "./computePreviewContentState";

describe("computePreviewContentState", () => {
  const base = {
    missingSetting: undefined,
    hasProblem: false,
    dataReady: false,
  };

  it("is empty while a setting is missing, then error, loading or ready", () => {
    expect(
      computePreviewContentState({ ...base, missingSetting: "username", hasProblem: true }),
    ).toBe("empty");
    expect(computePreviewContentState({ ...base, missingSetting: "quote", dataReady: true })).toBe(
      "empty",
    );
    expect(computePreviewContentState({ ...base, hasProblem: true })).toBe("error");
    expect(computePreviewContentState(base)).toBe("loading");
    expect(computePreviewContentState({ ...base, dataReady: true })).toBe("ready");
  });
});

describe("previewLoadingMessage", () => {
  it("names the data being loaded", () => {
    expect(previewLoadingMessage(["user", "contributions"])).toBe(
      "Loading profile and contributions…",
    );
  });
});
