import { describe, expect, it } from "vitest";
import { parseLinkSettings, withLink } from "./linkSettings";

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

  it("reads positions as x,y", () => {
    expect(
      parseLinkSettings("github-banner", {
        contentPosition: "100,0",
        backgroundPosition: "25.5,80",
      })?.settings,
    ).toEqual({ contentPosition: { x: 100, y: 0 }, backgroundPosition: { x: 25.5, y: 80 } });
    expect(
      parseLinkSettings("quote-banner", { contentPosition: "120,0", backgroundPosition: "50" }),
    ).toBeNull();
  });

  it("uses the first of repeated values", () => {
    expect(parseLinkSettings("quote-banner", { quote: ["Hi", "Bye"] })?.settings).toEqual({
      quote: "Hi",
    });
  });
});

describe("withLink", () => {
  const saved = {
    settings: {
      alignment: "right",
      backgroundImage: "/backgrounds/seoul.avif",
      backgroundPosition: { x: 20, y: 70 },
      backgroundZoom: 1.25,
    },
    username: "saved-user",
  };

  it("applies the link over the saved settings and username", () => {
    expect(withLink(saved, { settings: { alignment: "left" }, username: "linked-user" })).toEqual({
      settings: { ...saved.settings, alignment: "left" },
      username: "linked-user",
    });
  });

  it("doesn't move a linked background to the saved one's position and zoom", () => {
    const result = withLink(saved, {
      settings: { backgroundImage: "/backgrounds/sydney.avif" },
      username: null,
    });
    expect(result.settings).toEqual({
      alignment: "right",
      backgroundImage: "/backgrounds/sydney.avif",
    });
    expect(result.username).toBe("saved-user");
  });

  it("moves a linked background to the link's position", () => {
    const result = withLink(saved, {
      settings: { backgroundImage: "/backgrounds/sydney.avif", backgroundPosition: { x: 0, y: 0 } },
      username: null,
    });
    expect(result.settings).toEqual({
      alignment: "right",
      backgroundImage: "/backgrounds/sydney.avif",
      backgroundPosition: { x: 0, y: 0 },
    });
  });

  it("keeps the saved settings without a link", () => {
    expect(withLink(saved, null)).toBe(saved);
  });
});
