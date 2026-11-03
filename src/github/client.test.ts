import { afterEach, describe, expect, it, vi } from "vitest";
import { contributionsTtlMs, TTL_SHORT } from "./client";

describe("contributionsTtlMs", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps past years long, and the current year and latest short", () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 9, 18) });
    expect(contributionsTtlMs("2025")).toBe(6 * 60 * 60 * 1000);
    expect(contributionsTtlMs("2026")).toBe(TTL_SHORT);
    expect(contributionsTtlMs("latest")).toBe(TTL_SHORT);
  });
});
