import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { GithubRequestFailed } from "@/src/github/errors";

const { githubQuery } = vi.hoisted(() => ({ githubQuery: vi.fn() }));

vi.mock("@/src/github/graphql", () => ({ githubQuery, QUOTA_FIELDS: "" }));

const { loadRepoStars } = await import("./stars");

function page(starredAt: string[], endCursor: string | null, stargazerCount = 3) {
  return Effect.succeed({
    repository: {
      stargazerCount,
      stargazers: {
        edges: starredAt.map((date) => ({ starredAt: date })),
        pageInfo: { hasNextPage: endCursor !== null, endCursor },
      },
    },
  });
}

afterEach(() => githubQuery.mockReset());

describe("loadRepoStars", () => {
  it("counts the stars per UTC day across pages", async () => {
    githubQuery
      .mockReturnValueOnce(page(["2026-11-01T10:00:00Z", "2026-11-01T23:59:59Z"], "next"))
      .mockReturnValueOnce(page(["2026-11-05T08:00:00Z"], null));
    expect(await loadRepoStars()).toEqual({
      total: 3,
      perDay: { "2026-11-01": 2, "2026-11-05": 1 },
    });
    expect(githubQuery.mock.calls.map(([, variables]) => variables)).toEqual([
      { owner: "marhjoh", name: "omnivix", after: null },
      { owner: "marhjoh", name: "omnivix", after: "next" },
    ]);
  });

  it("has no history when the token can't list who starred", async () => {
    githubQuery.mockReturnValueOnce(page([], null, 2));
    expect(await loadRepoStars()).toEqual({ total: 2, perDay: null });
  });

  it.each([
    [
      "GitHub fails",
      Effect.fail(new GithubRequestFailed({ cause: new Error("down"), transient: false })),
    ],
    ["there's no token", Effect.die(new Error("GITHUB_TOKEN is not set"))],
  ])("gives null when %s", async (_, result) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    githubQuery.mockReturnValue(result);
    expect(await loadRepoStars()).toBeNull();
  });
});
