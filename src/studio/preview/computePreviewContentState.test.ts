import { describe, expect, it } from "vitest";
import {
  computePreviewContentState,
  previewLoadingMessage,
  fetchErrorProblem,
  noReposProblem,
  userNotFoundProblem,
  githubLimitProblem,
} from "./computePreviewContentState";

describe("computePreviewContentState", () => {
  const base = {
    needsUsername: true,
    username: "octocat",
    missingContent: false,
    dataError: null as string | null,
    dataReady: false,
  };

  it("returns empty when username required but missing", () => {
    expect(
      computePreviewContentState({
        ...base,
        username: "  ",
        dataReady: true,
      }),
    ).toBe("empty");
  });

  it("returns error when dataError set", () => {
    expect(
      computePreviewContentState({
        ...base,
        dataError: "Network error",
        dataReady: false,
      }),
    ).toBe("error");
  });

  it("returns loading when username set but data not ready", () => {
    expect(computePreviewContentState({ ...base, dataReady: false })).toBe("loading");
  });

  it("returns ready when data ready", () => {
    expect(computePreviewContentState({ ...base, dataReady: true })).toBe("ready");
  });

  it("is empty when required content (the quote) is missing", () => {
    expect(
      computePreviewContentState({
        ...base,
        needsUsername: false,
        username: "",
        missingContent: true,
        dataReady: true,
      }),
    ).toBe("empty");
  });
});

describe("noReposProblem", () => {
  it("explains an empty pinned list", () => {
    expect(noReposProblem("pinned", "")).toMatchObject({
      title: "No pinned repositories",
    });
  });

  it("asks to pick repositories when none are selected", () => {
    expect(noReposProblem("selected", " ")).toMatchObject({
      title: "No repositories selected",
    });
  });

  it("says none matched when the selected ones weren't found", () => {
    expect(noReposProblem("selected", "gone-repo")).toMatchObject({
      title: "No matching repositories",
    });
  });
});

describe("fetchErrorProblem", () => {
  it("uses the server message as a heading (no period) and offers a retry", () => {
    expect(fetchErrorProblem("Couldn't load the GitHub profile.")).toEqual({
      title: "Couldn't load the GitHub profile",
      hint: "Check the username or your connection, then try again.",
      action: "retry",
    });
  });
});

describe("userNotFoundProblem", () => {
  it("names the user and offers to change the username", () => {
    expect(userNotFoundProblem(" ghost ")).toEqual({
      title: "No GitHub user named @ghost",
      hint: "Check the spelling, or choose another username.",
      action: "change-username",
    });
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

describe("githubLimitProblem", () => {
  it("says when the limit resets and keeps Try again off until then", () => {
    const resetAt = new Date(2026, 9, 18, 14, 5);
    expect(githubLimitProblem(resetAt)).toEqual({
      title: "GitHub's limit is reached",
      hint: `Try again at ${resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
      action: "retry",
      retryAt: resetAt,
    });
  });
});
