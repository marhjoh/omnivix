import { describe, expect, it } from "vitest";
import {
  FORMAT_COOKIE,
  PIXEL_RATIO_COOKIE,
  PREVIEW_VIEW_COOKIE,
  settingsCookie,
  USERNAME_COOKIE,
} from "./studioCookies";

const parseSettingsCookie = settingsCookie("quote-banner").parse;

describe("settingsCookie", () => {
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

describe("USERNAME_COOKIE", () => {
  it("reads a valid username", () => {
    expect(USERNAME_COOKIE.parse("marhjoh")).toBe("marhjoh");
    expect(USERNAME_COOKIE.parse("some-user")).toBe("some-user");
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
    expect(USERNAME_COOKIE.parse(value)).toBeNull();
  });
});

describe("settingsCookie name", () => {
  it("is one cookie per template", () => {
    expect(settingsCookie("quote-banner").name).toBe("omnivix-settings-quote-banner");
  });
});

describe("PIXEL_RATIO_COOKIE", () => {
  it.each([
    ["1", 1],
    ["2", 2],
    ["3", 3],
  ])("reads %s", (value, ratio) => {
    expect(PIXEL_RATIO_COOKIE.parse(value)).toBe(ratio);
  });

  it.each([undefined, "", "4", "0", "2.5", "abc"])("falls back to 3× for %s", (value) => {
    expect(PIXEL_RATIO_COOKIE.parse(value)).toBe(3);
  });
});

describe("FORMAT_COOKIE", () => {
  it.each(["png", "jpeg"])("reads %s", (value) => {
    expect(FORMAT_COOKIE.parse(value)).toBe(value);
  });

  it.each([undefined, "", "jpg", "JPEG", "webp"])("falls back to PNG for %s", (value) => {
    expect(FORMAT_COOKIE.parse(value)).toBe("png");
  });
});

describe("PREVIEW_VIEW_COOKIE", () => {
  it.each(["phone", "desktop", "tv"])("reads %s", (value) => {
    expect(PREVIEW_VIEW_COOKIE.parse(value)).toBe(value);
  });

  it.each([undefined, "", "TV", "tablet"])("falls back to phone for %s", (value) => {
    expect(PREVIEW_VIEW_COOKIE.parse(value)).toBe("phone");
  });
});
