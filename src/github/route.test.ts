import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GithubRateLimitError } from "./rateLimit";
import { githubRoute } from "./route";

const request = (username: string) =>
  new NextRequest(`http://localhost/api/github/user-summary?username=${username}`);

describe("githubRoute", () => {
  it("returns the data", async () => {
    const response = await githubRoute(request("marhjoh"), "Failed.", async () => ({ ok: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 429 with the reset time when GitHub's limit is reached", async () => {
    const resetAt = new Date(Date.now() + 90_000);
    const response = await githubRoute(request("marhjoh"), "Failed.", () =>
      Promise.reject(new GithubRateLimitError(resetAt)),
    );
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(89);
    expect(await response.json()).toEqual({
      error: "GitHub's limit is reached.",
      resetAt: resetAt.toISOString(),
    });
  });

  it("returns 404 for a user that doesn't exist", async () => {
    const notFound = { errors: [{ type: "NOT_FOUND", path: ["user"] }] };
    const response = await githubRoute(request("nobody"), "Failed.", () =>
      Promise.reject(notFound),
    );
    expect(response.status).toBe(404);
  });

  it("returns 502 with the failure message for other errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await githubRoute(request("marhjoh"), "Failed.", () =>
      Promise.reject(new Error("boom")),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Failed." });
  });
});
