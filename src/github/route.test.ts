import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GithubRateLimitError } from "./rateLimit";
import { githubRoute } from "./route";

const limitedUntil = vi.hoisted(() => vi.fn(async (): Promise<Date | null> => null));

vi.mock("@/src/lib/requestLimit", () => ({ requestLimit: () => limitedUntil }));

const request = (username: string) =>
  new NextRequest(`http://localhost/api/github/user-summary?username=${username}`);

const route = (username: string, load: () => Promise<unknown>) =>
  githubRoute(request(username), { failure: "Failed.", ttlMs: 180_000, load });

describe("githubRoute", () => {
  it("returns the data, cached by the CDN for the TTL", async () => {
    const response = await route("marhjoh", async () => ({ ok: true }));
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
    const response = await route("marhjoh", () =>
      Promise.reject(new GithubRateLimitError(resetAt)),
    );
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
    const notFound = { errors: [{ type: "NOT_FOUND", path: ["user"] }] };
    const response = await route("nobody", () => Promise.reject(notFound));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("returns 502 with the failure message for other errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await route("marhjoh", () => Promise.reject(new Error("boom")));
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(await response.json()).toEqual({ error: "Failed." });
  });
});
