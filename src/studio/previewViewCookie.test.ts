import { describe, expect, it } from "vitest";
import { parsePreviewViewCookie } from "./previewViewCookie";

describe("parsePreviewViewCookie", () => {
  it.each(["phone", "desktop", "tv"])("reads %s", (value) => {
    expect(parsePreviewViewCookie(value)).toBe(value);
  });

  it.each([undefined, "", "TV", "tablet"])("falls back to phone for %s", (value) => {
    expect(parsePreviewViewCookie(value)).toBe("phone");
  });
});
