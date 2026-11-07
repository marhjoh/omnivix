import { describe, expect, it } from "vitest";
import { applySavedSettings, isSavableImage, POSITION_KEYS } from "./savedSettings";
import { getTemplates, templateRegistry } from "@/src/templates/registry";
import { checkTemplateState } from "@/src/templates/stateSchemas";

describe("isSavableImage", () => {
  it.each(["/backgrounds/seoul.avif", "https://example.com/photo.jpg"])("keeps %s", (value) => {
    expect(isSavableImage("backgroundImage", value)).toBe(true);
  });

  it.each([
    "data:image/png;base64,AAAA",
    "http://example.com/photo.jpg",
    "/backgrounds/missing.avif",
    "/etc/passwd",
    undefined,
  ])("leaves out %s", (value) => {
    expect(isSavableImage("backgroundImage", value)).toBe(false);
  });

  it("keeps https logos, not built-in backgrounds or uploads", () => {
    expect(isSavableImage("logoImage", "https://example.com/logo.svg")).toBe(true);
    expect(isSavableImage("logoImage", "/backgrounds/seoul.avif")).toBe(false);
    expect(isSavableImage("logoImage", "data:image/png;base64,AAAA")).toBe(false);
  });
});

describe("applySavedSettings backgrounds", () => {
  const defaults = { ...templateRegistry["quote-banner"].initialState };

  it("restores a saved preset with its position, zoom and opacity", () => {
    const saved = {
      backgroundImage: "/backgrounds/seoul.avif",
      backgroundPosition: { x: 20, y: 70 },
      backgroundZoom: 1.2,
      backgroundOpacity: 60,
    };
    expect(applySavedSettings(defaults, "quote-banner", saved, null)).toMatchObject(saved);
  });

  it("drops a background that can't be saved with its position, and keeps its zoom", () => {
    const state = applySavedSettings(
      defaults,
      "quote-banner",
      {
        backgroundImage: "data:image/png;base64,AAAA",
        backgroundPosition: { x: 20, y: 70 },
        backgroundZoom: 1.2,
      },
      null,
    );
    expect(state.backgroundImage).toBeUndefined();
    expect(state.backgroundPosition).toBeUndefined();
    expect(state.backgroundZoom).toBe(1.2);
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

describe("applySavedSettings logos", () => {
  const defaults = { ...templateRegistry["quote-banner"].initialState };

  it("keeps a linked logo with its size and position", () => {
    const saved = {
      logoImage: "https://example.com/logo.svg",
      logoSize: "xl",
      logoPosition: { x: 0, y: 100 },
    };
    expect(applySavedSettings(defaults, "quote-banner", saved, null)).toMatchObject(saved);
  });

  it("drops an uploaded logo but keeps its place and size for the next one", () => {
    const result = applySavedSettings(
      defaults,
      "quote-banner",
      { logoImage: "data:image/png;base64,AAAA", logoSize: "s", logoPosition: { x: 0, y: 0 } },
      null,
    );
    expect(result).not.toHaveProperty("logoImage");
    expect(result).toMatchObject({ logoSize: "s", logoPosition: { x: 0, y: 0 } });
  });
});

describe("applySavedSettings values", () => {
  const defaults = templateRegistry["repos-banner"].initialState;

  it("keeps saved values the controls could have set", () => {
    const saved = { showStars: false, maxRepos: 3, platform: "x", backgroundZoom: 1.2 };
    expect(applySavedSettings(defaults, "repos-banner", saved, "a")).toMatchObject(saved);
  });

  it("falls back to the default for a value of the wrong type or out of range", () => {
    const result = applySavedSettings(
      defaults,
      "repos-banner",
      { showStars: "no", maxRepos: 99, selectedRepos: 1, backgroundZoom: 9, platform: "myspace" },
      "a",
    );
    expect(result).toMatchObject({
      showStars: defaults.showStars,
      maxRepos: defaults.maxRepos,
      selectedRepos: defaults.selectedRepos,
    });
    expect(result).not.toHaveProperty("backgroundZoom");
    expect(result).not.toHaveProperty("platform");
  });
});

describe("applySavedSettings and the template schemas", () => {
  // Wrong for most settings: the wrong type, out of range, or not one of the options.
  const BAD_VALUES = [null, true, -1, 9999, "nope", { x: 1 }];
  const OPTIONAL_KEYS = [
    ...POSITION_KEYS,
    "backgroundImage",
    "logoImage",
    "backgroundZoom",
    "backgroundOpacity",
  ];

  for (const { meta, initialState } of getTemplates()) {
    it.each(BAD_VALUES)(
      `gives ${meta.id} settings its schema takes, when %j was saved`,
      (value) => {
        const keys = [...Object.keys(initialState), ...OPTIONAL_KEYS];
        const saved = Object.fromEntries(keys.map((key) => [key, value]));
        const state = applySavedSettings(initialState, meta.id, saved, "octocat");
        expect(checkTemplateState(meta.id, state)).toMatchObject({ ok: true });
      },
    );
  }
});
