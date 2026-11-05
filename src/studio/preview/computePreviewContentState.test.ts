import { describe, expect, it } from "vitest";
import {
  computePreviewContentState,
  previewEmptyCopy,
  previewLoadingMessage,
} from "./computePreviewContentState";

describe("computePreviewContentState", () => {
  const base = {
    missingSetting: undefined,
    hasProblem: false,
    dataReady: false,
  };

  it("is empty while a setting is missing, before anything else", () => {
    expect(
      computePreviewContentState({ ...base, missingSetting: "username", hasProblem: true }),
    ).toBe("empty");
    expect(computePreviewContentState({ ...base, missingSetting: "quote", dataReady: true })).toBe(
      "empty",
    );
  });

  it("returns error when there's a problem", () => {
    expect(computePreviewContentState({ ...base, hasProblem: true })).toBe("error");
  });

  it("returns loading until the data is ready", () => {
    expect(computePreviewContentState(base)).toBe("loading");
  });

  it("returns ready when data ready", () => {
    expect(computePreviewContentState({ ...base, dataReady: true })).toBe("ready");
  });
});

describe("previewLoadingMessage", () => {
  it("names the data being loaded", () => {
    expect(previewLoadingMessage(["user", "contributions"])).toBe(
      "Loading profile and contributions…",
    );
    expect(previewLoadingMessage(["contributions"])).toBe("Loading contributions…");
    expect(previewLoadingMessage(["user", "repos"])).toBe("Loading profile and repositories…");
    expect(previewLoadingMessage([])).toBe("Loading…");
  });
});

describe("previewEmptyCopy", () => {
  it("asks for a username, which opens the username dialog", () => {
    expect(previewEmptyCopy("username")).toMatchObject({
      title: "Choose a GitHub username",
      action: { label: "Choose username", setting: "username" },
    });
  });

  it("asks for the quote, with the cursor put in its field", () => {
    expect(previewEmptyCopy("quote")).toEqual({
      title: "Add your quote",
      hint: "Enter quote text in the sidebar to see it here.",
      action: { label: "Add quote", setting: "quote" },
    });
  });
});
