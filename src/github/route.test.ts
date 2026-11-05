import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { NextRequest } from "next/server";
import {
  GithubRateLimited,
  GithubRequestFailed,
  GithubUserNotFound,
  type GithubError,
} from "./errors";
import { githubRoute } from "./route";

const limitedUntil = vi.hoisted(() => vi.fn(async (): Promise<Date | null> => null));

vi.mock("@/src/lib/requestLimits", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/lib/requestLimits")>()),
  githubDataLimit: limitedUntil,
}));

const request = (username: string) =>
  new NextRequest(`http://localhost/api/github/user-summary?username=${username}`);

const route = (username: string, load: () => Effect.Effect<unknown, GithubError>) =>
  githubRoute(request(username), { failure: "Failed.", ttlMs: 180_000, load });

describe("githubRoute", () => {
  it("returns the data, cached by the CDN for the TTL", async () => {
    const response = await route("marhjoh", () => Effect.succeed({ ok: true }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=180");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 429 without calling GitHub when the visitor is over our limit", async () => {
    const resetAt = new Date(Date.now() + 60_000);
    limitedUntil.mockResolvedValueOnce(resetAt);
    const load = vi.fn();
    const response = await route("marhjoh", load);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many requests.",
      limit: "requests",
      resetAt: resetAt.toISOString(),
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("returns 429 with the reset time when GitHub's limit is reached", async () => {
    const resetAt = new Date(Date.now() + 90_000);
    const response = await route("marhjoh", () => Effect.fail(new GithubRateLimited({ resetAt })));
    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(89);
    expect(await response.json()).toEqual({
      error: "GitHub's limit is reached.",
      limit: "github",
      resetAt: resetAt.toISOString(),
    });
  });

  it("returns 404 for a user that doesn't exist", async () => {
    const response = await route("nobody", () => Effect.fail(new GithubUserNotFound()));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("returns 502 with the failure message for other errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await route("marhjoh", () =>
      Effect.fail(new GithubRequestFailed({ cause: new Error("boom"), transient: false })),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(await response.json()).toEqual({ error: "Failed." });
  });
});
