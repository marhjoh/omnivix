import { describe, expect, it } from "vitest";
import { isInsecureImageLink } from "./imageLink";

describe("isInsecureImageLink", () => {
  it("flags http links", () => {
    expect(isInsecureImageLink("http://example.com/a.jpg")).toBe(true);
    expect(isInsecureImageLink("  HTTP://example.com/a.jpg")).toBe(true);
  });

  it.each([
    "https://example.com/a.jpg",
    "/backgrounds/london.avif",
    "data:image/webp;base64,AA",
    undefined,
  ])("allows %s", (value) => {
    expect(isInsecureImageLink(value)).toBe(false);
  });
});
