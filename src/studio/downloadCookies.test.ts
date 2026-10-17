import { describe, expect, it } from "vitest";
import { parseFormatCookie, parsePixelRatioCookie } from "./downloadCookies";

describe("parsePixelRatioCookie", () => {
  it.each([
    ["1", 1],
    ["2", 2],
    ["3", 3],
  ])("reads %s", (value, ratio) => {
    expect(parsePixelRatioCookie(value)).toBe(ratio);
  });

  it.each([undefined, "", "4", "0", "2.5", "abc"])("falls back to 3× for %s", (value) => {
    expect(parsePixelRatioCookie(value)).toBe(3);
  });
});

describe("parseFormatCookie", () => {
  it.each(["png", "jpeg"])("reads %s", (value) => {
    expect(parseFormatCookie(value)).toBe(value);
  });

  it.each([undefined, "", "jpg", "JPEG", "webp"])("falls back to PNG for %s", (value) => {
    expect(parseFormatCookie(value)).toBe("png");
  });
});
