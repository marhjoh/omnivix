import { describe, expect, it } from "vitest";
import { exportLimitMessage, githubLimitMessage, tryAgainAt } from "./rateLimitMessage";

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

describe("export limit wording", () => {
  it("says when to try again, when the response tells", () => {
    const retryAt = new Date(2026, 9, 18, 14, 5);
    const time = retryAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    expect(exportLimitMessage(retryAt)).toBe(`Too many exports. Try again at ${time}.`);
  });

  it("falls back to a few minutes, within the firewall rule's window", () => {
    expect(exportLimitMessage(null)).toBe("Too many exports. Try again in a few minutes.");
  });
});
