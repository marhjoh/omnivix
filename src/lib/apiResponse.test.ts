import { describe, expect, it } from "vitest";
import { tooManyRequests } from "./apiResponse";

describe("tooManyRequests", () => {
  it("names the limit, with its reset time and Retry-After", async () => {
    const resetAt = new Date(Date.now() + 90_000);
    const response = tooManyRequests("daily-exports", resetAt);
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(89);
    expect(await response.json()).toEqual({
      error: "Daily export limit reached.",
      limit: "daily-exports",
      resetAt: resetAt.toISOString(),
    });
  });
});
