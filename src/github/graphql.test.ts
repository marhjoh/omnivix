import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, Exit, Schema } from "effect";
import { githubQuery } from "./graphql";

const User = Schema.Struct({ user: Schema.Struct({ login: Schema.String }) });

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GITHUB_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

const run = () => Effect.runPromiseExit(githubQuery("query", { username: "octocat" }, User));

/** The failure's tag, or "Success". */
async function outcome() {
  const exit = await run();
  if (Exit.isSuccess(exit)) return "Success";
  const error = exit.cause.reasons.find((reason) => reason._tag === "Fail");
  return error && "error" in error ? (error.error as { _tag: string })._tag : "Defect";
}

describe("githubQuery", () => {
  it("decodes the data and sends the token", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { data: { user: { login: "octocat" } } }));
    expect(await run()).toEqual(Exit.succeed({ user: { login: "octocat" } }));
    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("authorization")).toBe("bearer test-token");
  });

  it("reports a missing user", async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, { data: { user: null }, errors: [{ type: "NOT_FOUND", path: ["user"] }] }),
    );
    expect(await outcome()).toBe("GithubUserNotFound");
  });

  it("fails on a response that doesn't match the query, without retrying", async () => {
    fetchMock.mockResolvedValue(json(200, { data: { user: { login: 42 } } }));
    expect(await outcome()).toBe("GithubRequestFailed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tries a server error once more", async () => {
    fetchMock
      .mockResolvedValueOnce(json(502, { message: "Bad gateway" }))
      .mockResolvedValueOnce(json(200, { data: { user: { login: "octocat" } } }));
    expect(await outcome()).toBe("Success");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after a second network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    expect(await outcome()).toBe("GithubRequestFailed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // Last: the rate limit is remembered until it resets (see guardRateLimit).
  it("reports GitHub's rate limit", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(json(200, { errors: [{ type: "RATE_LIMITED" }] }));
    expect(await outcome()).toBe("GithubRateLimited");
  });
});
