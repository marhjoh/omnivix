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

  it.each([undefined, "bad name", "%3Cscript%3E", "%E0%A4%A"])("rejects %s", (value) => {
    expect(USERNAME_COOKIE.parse(value)).toBeNull();
  });
});

describe("PIXEL_RATIO_COOKIE", () => {
  it("reads a ratio", () => {
    expect(PIXEL_RATIO_COOKIE.parse("2")).toBe(2);
  });

  it.each([undefined, "4", "2.5"])("falls back to 3× for %s", (value) => {
    expect(PIXEL_RATIO_COOKIE.parse(value)).toBe(3);
  });
});

describe("FORMAT_COOKIE", () => {
  it("reads a format", () => {
    expect(FORMAT_COOKIE.parse("jpeg")).toBe("jpeg");
  });

  it.each([undefined, "JPEG"])("falls back to PNG for %s", (value) => {
    expect(FORMAT_COOKIE.parse(value)).toBe("png");
  });
});

describe("PREVIEW_VIEW_COOKIE", () => {
  it("reads a view", () => {
    expect(PREVIEW_VIEW_COOKIE.parse("tv")).toBe("tv");
  });

  it.each([undefined, "TV"])("falls back to phone for %s", (value) => {
    expect(PREVIEW_VIEW_COOKIE.parse(value)).toBe("phone");
  });
});
