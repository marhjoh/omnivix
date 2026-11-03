import { describe, expect, it } from "vitest";
import { isOneOf, oneOfOr } from "./isOneOf";

describe("isOneOf", () => {
  it("accepts listed values only", () => {
    expect(isOneOf(["a", "b"], "a")).toBe(true);
    expect(isOneOf(["a", "b"], "c")).toBe(false);
    expect(isOneOf(["a", "b"], undefined)).toBe(false);
  });
});

describe("oneOfOr", () => {
  it("falls back for anything not listed", () => {
    expect(oneOfOr(["a", "b"], "b", "a")).toBe("b");
    expect(oneOfOr(["a", "b"], "c", "a")).toBe("a");
    expect(oneOfOr(["a", "b"], 1, "a")).toBe("a");
  });
});
