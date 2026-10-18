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
