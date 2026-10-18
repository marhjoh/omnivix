import { afterEach, describe, expect, it, vi } from "vitest";
import { GithubRateLimitError, guardRateLimit, rateLimitResetAt } from "./rateLimit";

const NOW = Date.UTC(2026, 9, 18, 12, 0, 0);
const IN_AN_HOUR = NOW / 1000 + 3600;

describe("rateLimitResetAt", () => {
  it("reads a GraphQL RATE_LIMITED error", () => {
    const error = {
      errors: [{ type: "RATE_LIMITED" }],
      headers: { "x-ratelimit-reset": IN_AN_HOUR },
    };
    expect(rateLimitResetAt(error, NOW)).toEqual(new Date(IN_AN_HOUR * 1000));
  });

  it("reads a 403 with no requests left", () => {
    const error = {
      status: 403,
      response: {
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(IN_AN_HOUR) },
      },
    };
    expect(rateLimitResetAt(error, NOW)).toEqual(new Date(IN_AN_HOUR * 1000));
  });

  it("prefers retry-after (a secondary limit)", () => {
    const error = { status: 403, response: { headers: { "retry-after": "30" } } };
    expect(rateLimitResetAt(error, NOW)).toEqual(new Date(NOW + 30_000));
  });

  it("waits a minute when a 429 says nothing about the reset", () => {
    expect(rateLimitResetAt({ status: 429, response: { headers: {} } }, NOW)).toEqual(
      new Date(NOW + 60_000),
    );
  });

  it.each([
    ["a missing user", { errors: [{ type: "NOT_FOUND" }] }],
    [
      "a 403 with requests left",
      { status: 403, response: { headers: { "x-ratelimit-remaining": "12" } } },
    ],
    ["a server error", { status: 502 }],
    ["a plain error", new Error("boom")],
    ["nothing", null],
  ])("ignores %s", (_, error) => {
    expect(rateLimitResetAt(error, NOW)).toBeNull();
  });
});

describe("guardRateLimit", () => {
  afterEach(() => vi.useRealTimers());

  it("turns a rate limit into GithubRateLimitError, then skips requests until the reset", async () => {
    vi.useFakeTimers({ now: NOW });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const limited = { status: 429, response: { headers: { "retry-after": "60" } } };
    await expect(guardRateLimit(() => Promise.reject(limited))).rejects.toBeInstanceOf(
      GithubRateLimitError,
    );

    const request = vi.fn(() => Promise.resolve("data"));
    await expect(guardRateLimit(request)).rejects.toMatchObject({
      resetAt: new Date(NOW + 60_000),
    });
    expect(request).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);

    vi.setSystemTime(NOW + 61_000);
    await expect(guardRateLimit(request)).resolves.toBe("data");
  });

  it("passes other errors through", async () => {
    vi.useFakeTimers({ now: NOW + 120_000 }); // past the reset from the test above
    const error = new Error("boom");
    await expect(guardRateLimit(() => Promise.reject(error))).rejects.toBe(error);
  });
});
