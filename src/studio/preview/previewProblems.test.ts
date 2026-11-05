import { describe, expect, it } from "vitest";
import {
  fetchErrorProblem,
  fetchProblem,
  limitProblem,
  noReposProblem,
  userNotFoundProblem,
} from "./previewProblems";

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

describe("limitProblem", () => {
  it("says when GitHub's limit resets and keeps Try again off until then", () => {
    const resetAt = new Date(2026, 9, 18, 14, 5);
    expect(limitProblem({ kind: "github", resetAt })).toEqual({
      title: "GitHub's limit is reached",
      hint: `Try again at ${resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
      action: "retry",
      retryAt: resetAt,
    });
  });

  it("names our own per-IP limit, with its reset time", () => {
    const resetAt = new Date(2026, 9, 18, 14, 5);
    expect(limitProblem({ kind: "requests", resetAt })).toMatchObject({
      title: "Too many requests",
      retryAt: resetAt,
    });
  });

  it("has no exact time for a bare 429", () => {
    expect(limitProblem({ kind: "firewall" })).toEqual({
      title: "Too many requests",
      hint: "Try again in a few minutes.",
      action: "retry",
    });
  });
});

describe("fetchProblem", () => {
  const failed = {
    error: "Couldn't load GitHub data.",
    limit: null,
    notFound: false,
    username: "x",
  };

  it("reports the limit that refused the request first", () => {
    const resetAt = new Date(2026, 9, 18, 14, 5);
    const limit = { kind: "requests", resetAt } as const;
    expect(fetchProblem({ ...failed, limit, notFound: true })).toEqual(limitProblem(limit));
  });

  it("offers to change a user that doesn't exist", () => {
    expect(fetchProblem({ ...failed, notFound: true })).toEqual(userNotFoundProblem("x"));
  });

  it("shows the request's own error otherwise", () => {
    expect(fetchProblem(failed)).toEqual(fetchErrorProblem(failed.error));
  });
});
