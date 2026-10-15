import { describe, expect, it } from "vitest";
import { parseSettingsCookie, parseUsernameCookie, settingsCookieName } from "./studioCookies";

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
