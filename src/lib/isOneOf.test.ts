import { describe, expect, it } from "vitest";
import { isOneOf } from "./isOneOf";

describe("isOneOf", () => {
  it("accepts listed values only", () => {
    expect(isOneOf(["a", "b"], "a")).toBe(true);
    expect(isOneOf(["a", "b"], "c")).toBe(false);
    expect(isOneOf(["a", "b"], undefined)).toBe(false);
  });
});
