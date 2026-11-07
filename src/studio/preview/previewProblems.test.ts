import { describe, expect, it } from "vitest";
import { fetchProblem, noReposProblem } from "./previewProblems";

describe("noReposProblem", () => {
  it("explains an empty pinned list, no selection and no match", () => {
    expect(noReposProblem("pinned", "")).toMatchObject({ title: "No pinned repositories" });
    expect(noReposProblem("selected", " ")).toMatchObject({ title: "No repositories selected" });
    expect(noReposProblem("selected", "gone-repo")).toMatchObject({
      title: "No matching repositories",
    });
  });
});

describe("fetchProblem", () => {
  const failed = {
    error: "Couldn't load the GitHub profile.",
    limit: null,
    notFound: false,
    username: " ghost ",
  };

  it("uses the server message as a heading (no period) and offers a retry", () => {
    expect(fetchProblem(failed)).toEqual({
      title: "Couldn't load the GitHub profile",
      hint: "Check the username or your connection, then try again.",
      action: "retry",
    });
  });

  it("reports the limit that refused the request first, with its reset time", () => {
    const resetAt = new Date(2026, 9, 18, 14, 5);
    const limit = { kind: "requests", resetAt } as const;
    expect(fetchProblem({ ...failed, limit, notFound: true })).toMatchObject({
      title: "Too many requests",
      retryAt: resetAt,
    });
  });

  it("has no exact time for a bare 429", () => {
    expect(fetchProblem({ ...failed, limit: { kind: "firewall" } })).toEqual({
      title: "Too many requests",
      hint: "Try again in a few minutes.",
      action: "retry",
    });
  });
});
