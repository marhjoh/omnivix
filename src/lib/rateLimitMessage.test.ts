import { describe, expect, it } from "vitest";
import { limitMessage } from "./rateLimitMessage";

describe("rate limit wording", () => {
  const resetAt = new Date(2026, 9, 18, 14, 5);
  const time = resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  it("names the limit and when it resets", () => {
    expect(limitMessage({ kind: "github", resetAt }, "Ours.")).toBe(
      `GitHub's limit is reached. Try again at ${time}.`,
    );
    expect(limitMessage({ kind: "requests", resetAt }, "Ours.")).toBe(
      `Too many requests. Try again at ${time}.`,
    );
  });

  it("uses the caller's sentence for a bare 429", () => {
    expect(limitMessage({ kind: "firewall" }, "Ours.")).toBe("Ours.");
  });
});
