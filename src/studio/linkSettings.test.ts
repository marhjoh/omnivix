import { describe, expect, it } from "vitest";
import { parseLinkSettings } from "./linkSettings";

describe("parseLinkSettings", () => {
  it("reads settings with the export API's keys", () => {
    expect(
      parseLinkSettings("contribution-banner", {
        username: "marhjoh",
        size: "header",
        themeId: "sunset",
        backgroundImage: "/backgrounds/seoul.avif",
      }),
    ).toEqual({
      settings: { size: "header", themeId: "sunset", backgroundImage: "/backgrounds/seoul.avif" },
      username: "marhjoh",
    });
  });

  it("turns toggles and numbers into their types", () => {
    expect(
      parseLinkSettings("repos-banner", { showStars: "false", maxRepos: "3" })?.settings,
    ).toEqual({ showStars: false, maxRepos: 3 });
  });

  it("leaves out values that aren't valid, keeping the rest", () => {
    expect(
      parseLinkSettings("github-banner", {
        username: "not a username",
        themeId: "neon",
        showTotal: "maybe",
        alignment: "left",
      }),
    ).toEqual({ settings: { alignment: "left" }, username: null });
  });

  it("ignores unknown keys, uploads and settings the template doesn't have", () => {
    expect(
      parseLinkSettings("quote-banner", {
        utm_source: "x",
        username: "marhjoh",
        themeId: "sunset",
        backgroundImage: "data:image/png;base64,AAAA",
      }),
    ).toBeNull();
  });

  it("accepts presets and https links as backgrounds", () => {
    expect(
      parseLinkSettings("quote-banner", { backgroundImage: "https://example.com/photo.jpg" })
        ?.settings,
    ).toEqual({ backgroundImage: "https://example.com/photo.jpg" });
    expect(
      parseLinkSettings("quote-banner", { backgroundImage: "http://example.com/photo.jpg" }),
    ).toBeNull();
  });

  it("uses the first of repeated values", () => {
    expect(parseLinkSettings("quote-banner", { quote: ["Hi", "Bye"] })?.settings).toEqual({
      quote: "Hi",
    });
  });
});
