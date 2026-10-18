import { describe, expect, it } from "vitest";
import { githubLimitMessage, tryAgainAt } from "./rateLimitMessage";

describe("rate limit wording", () => {
  const resetAt = new Date(2026, 9, 18, 14, 5);
  const time = resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  it("says when to try again, in local time", () => {
    expect(tryAgainAt(resetAt)).toBe(`Try again at ${time}.`);
  });

  it("builds the full sentence", () => {
    expect(githubLimitMessage(resetAt)).toBe(`GitHub's limit is reached. Try again at ${time}.`);
  });
});
