import { describe, expect, it } from "vitest";
import {
  parseFormatCookie,
  parsePixelRatioCookie,
  parsePreviewViewCookie,
  parseSettingsCookie,
  parseUsernameCookie,
  settingsCookieName,
} from "./studioCookies";

describe("parseSettingsCookie", () => {
  it("reads saved settings", () => {
    const value = encodeURIComponent(JSON.stringify({ alignment: "left", themeId: "ocean" }));
    expect(parseSettingsCookie(value)).toEqual({ alignment: "left", themeId: "ocean" });
  });

  it.each([
    undefined,
    "",
    "not json",
    encodeURIComponent("[1,2]"),
    encodeURIComponent("null"),
    "%E0%A4%A",
  ])("ignores %s", (value) => {
    expect(parseSettingsCookie(value)).toBeNull();
  });
});

describe("parseUsernameCookie", () => {
  it("reads a valid username", () => {
    expect(parseUsernameCookie("marhjoh")).toBe("marhjoh");
    expect(parseUsernameCookie("some-user")).toBe("some-user");
  });

  it.each([
    undefined,
    "",
    "bad name",
    "-leading",
    "trailing-",
    "a".repeat(40),
    "%3Cscript%3E",
    "%E0%A4%A",
  ])("rejects %s", (value) => {
    expect(parseUsernameCookie(value)).toBeNull();
  });
});

describe("settingsCookieName", () => {
  it("is one cookie per template", () => {
    expect(settingsCookieName("quote-banner")).toBe("omnivix-settings-quote-banner");
  });
});

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

describe("parsePreviewViewCookie", () => {
  it.each(["phone", "desktop", "tv"])("reads %s", (value) => {
    expect(parsePreviewViewCookie(value)).toBe(value);
  });

  it.each([undefined, "", "TV", "tablet"])("falls back to phone for %s", (value) => {
    expect(parsePreviewViewCookie(value)).toBe("phone");
  });
});
