import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect, Exit } from "effect";
import { GithubRateLimited } from "./errors";
import { guardRateLimit, rateLimitResetAt, warnIfQuotaLow } from "./rateLimit";

const NOW = Date.UTC(2026, 9, 18, 12, 0, 0);
const IN_AN_HOUR = NOW / 1000 + 3600;

const response = (status: number, headers: Record<string, string> = {}) => ({
  status,
  headers: new Headers(headers),
});

describe("rateLimitResetAt", () => {
  it("reads a GraphQL RATE_LIMITED error", () => {
    const limited = response(200, { "x-ratelimit-reset": String(IN_AN_HOUR) });
    expect(rateLimitResetAt(limited, [{ type: "RATE_LIMITED" }], NOW)).toEqual(
      new Date(IN_AN_HOUR * 1000),
    );
  });

  it("reads a 403 with no requests left", () => {
    const limited = response(403, {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(IN_AN_HOUR),
    });
    expect(rateLimitResetAt(limited, [], NOW)).toEqual(new Date(IN_AN_HOUR * 1000));
  });

  it("prefers retry-after (a secondary limit)", () => {
    expect(rateLimitResetAt(response(403, { "retry-after": "30" }), [], NOW)).toEqual(
      new Date(NOW + 30_000),
    );
  });

  it("waits a minute when a 429 says nothing about the reset", () => {
    expect(rateLimitResetAt(response(429), [], NOW)).toEqual(new Date(NOW + 60_000));
  });

  it.each([
    ["a missing user", response(200), [{ type: "NOT_FOUND" }]],
    ["a 403 with requests left", response(403, { "x-ratelimit-remaining": "12" }), []],
    ["a server error", response(502), []],
    ["a success", response(200), []],
  ])("ignores %s", (_, limited, errors) => {
    expect(rateLimitResetAt(limited, errors, NOW)).toBeNull();
  });
});

describe("guardRateLimit", () => {
  afterEach(() => vi.useRealTimers());

  it("remembers a rate limit and skips requests until the reset", async () => {
    vi.useFakeTimers({ now: NOW });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const resetAt = new Date(NOW + 60_000);
    const limited = await Effect.runPromiseExit(
      guardRateLimit(Effect.fail(new GithubRateLimited({ resetAt }))),
    );
    expect(Exit.isFailure(limited)).toBe(true);

    const request = vi.fn(() => "data");
    const skipped = await Effect.runPromiseExit(guardRateLimit(Effect.sync(request)));
    expect(skipped).toMatchObject({ _tag: "Failure" });
    expect(String(Exit.isFailure(skipped) && skipped.cause)).toContain("GithubRateLimited");
    expect(request).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);

    vi.setSystemTime(NOW + 61_000);
    expect(await Effect.runPromise(guardRateLimit(Effect.sync(request)))).toBe("data");
  });

  it("passes other errors through", async () => {
    vi.useFakeTimers({ now: NOW + 120_000 }); // past the reset from the test above
    const exit = await Effect.runPromiseExit(guardRateLimit(Effect.fail("boom")));
    expect(exit).toEqual(Exit.fail("boom"));
  });
});

describe("warnIfQuotaLow", () => {
  afterEach(() => vi.restoreAllMocks());

  it("warns below 10% left, once per quota window", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfQuotaLow({ limit: 5000, remaining: 500, resetAt: "2026-10-18T13:00:00Z" });
    expect(warn).not.toHaveBeenCalled();

    warnIfQuotaLow({ limit: 5000, remaining: 499, resetAt: "2026-10-18T13:00:00Z" });
    warnIfQuotaLow({ limit: 5000, remaining: 300, resetAt: "2026-10-18T13:00:00Z" });
    expect(warn).toHaveBeenCalledTimes(1);

    warnIfQuotaLow({ limit: 5000, remaining: 100, resetAt: "2026-10-18T14:00:00Z" });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
