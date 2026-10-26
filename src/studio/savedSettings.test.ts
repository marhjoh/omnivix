import { describe, expect, it } from "vitest";
import { applySavedSettings, isSavableBackground } from "./savedSettings";
import { templateRegistry } from "@/src/templates/registry";

describe("isSavableBackground", () => {
  it.each(["/backgrounds/seoul.avif", "https://example.com/photo.jpg"])("keeps %s", (value) => {
    expect(isSavableBackground(value)).toBe(true);
  });

  it.each([
    "data:image/png;base64,AAAA",
    "http://example.com/photo.jpg",
    "/backgrounds/missing.avif",
    "/etc/passwd",
    undefined,
  ])("leaves out %s", (value) => {
    expect(isSavableBackground(value)).toBe(false);
  });
});

describe("applySavedSettings backgrounds", () => {
  const defaults = { ...templateRegistry["quote-banner"].initialState };

  it("restores a saved preset with its position and zoom", () => {
    const saved = {
      backgroundImage: "/backgrounds/seoul.avif",
      backgroundPosition: { x: 20, y: 70 },
      backgroundZoom: 1.2,
    };
    expect(applySavedSettings(defaults, "quote-banner", saved, null)).toMatchObject(saved);
  });

  it("drops a background that can't be saved, with its position and zoom", () => {
    const state = applySavedSettings(
      defaults,
      "quote-banner",
      { backgroundImage: "data:image/png;base64,AAAA", backgroundZoom: 1.2 },
      null,
    );
    expect(state.backgroundImage).toBeUndefined();
    expect(state.backgroundZoom).toBeUndefined();
  });
});

describe("applySavedSettings positions", () => {
  const defaults = { ...templateRegistry["github-banner"].initialState };

  it("restores a moved content, kept between 0 and 100", () => {
    expect(
      applySavedSettings(defaults, "github-banner", { contentPosition: { x: 30, y: 120 } }, "a")
        .contentPosition,
    ).toEqual({ x: 30, y: 100 });
  });

  it("gives content at the left, the center or the right that alignment", () => {
    const at = (x: number) =>
      applySavedSettings(
        { ...templateRegistry["quote-banner"].initialState },
        "quote-banner",
        { alignment: "center", contentPosition: { x, y: 50 } },
        null,
      ).alignment;
    expect(at(0)).toBe("left");
    expect(at(100)).toBe("right");
    expect(at(30)).toBe("center");
  });

  it("drops a position that isn't one", () => {
    const result = applySavedSettings(
      defaults,
      "github-banner",
      { contentPosition: "30,10", backgroundPosition: { x: 1 } },
      "a",
    );
    expect(result).not.toHaveProperty("contentPosition");
    expect(result).not.toHaveProperty("backgroundPosition");
  });
});
