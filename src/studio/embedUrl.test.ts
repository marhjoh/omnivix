import { describe, expect, it } from "vitest";
import { getTemplates } from "@/src/templates/registry";
import type { BannerSettings, EditorFieldSchema } from "@/src/templates/types";
import { GRID_COLOR_IDS } from "@/src/banner/gridColors";
import { LATEST_YEAR } from "@/src/lib/contributionYear";
import { bannerImageUrl, linkQuery } from "./embedUrl";
import { parseLinkSettings } from "./parseLinkSettings";

/** A valid value for the setting that isn't its default. */
function changed(field: EditorFieldSchema, initial: unknown): unknown {
  if (field.format) return field.format("Ship it 2!");
  switch (field.type) {
    case "toggle":
      return !initial;
    case "range":
      return initial === field.min ? field.max : field.min;
    case "sizeSelect":
      return "header";
    case "backgroundPicker":
      return "/backgrounds/london.avif";
    case "logoPicker":
      return "https://example.com/logo.svg";
    case "photoPicker":
      return "https://example.com/photo.jpg";
    case "colorPicker":
      return "#ff6600";
    case "repoMultiSelect":
      return "omnivix, dotfiles";
    case "iconPicker":
      return "rust, git";
    case "text":
    case "textarea":
      return "Ship it, (twice) & smile #1";
  }
  if (field.key === "themeId") return GRID_COLOR_IDS.find((id) => id !== initial);
  if (field.key === "year") return LATEST_YEAR;
  return field.options!.find((option) => option.value !== initial)!.value;
}

const DRAGGED = {
  backgroundPosition: { x: 25.5, y: 80 },
  backgroundZoom: 1.25,
  backgroundOpacity: 60,
  contentPosition: { x: 100, y: 0 },
  logoPosition: { x: 0, y: 0 },
};

const IMAGE_OPTIONS = { format: "png", pixelRatio: 3, uiTheme: "dark" } as const;

describe("linkQuery", () => {
  for (const { meta, schema, initialState } of getTemplates()) {
    it(`writes what parseLinkSettings reads back for ${meta.id}`, () => {
      const defaults: Readonly<Record<string, unknown>> = initialState;
      const settings = {
        ...Object.fromEntries(
          schema.map((field) => [field.key, changed(field, defaults[field.key])]),
        ),
        ...DRAGGED,
      };
      const username = meta.needsUsername ? "octocat" : null;
      // `changed` gives each field a value it takes.
      const state = {
        ...initialState,
        ...settings,
        ...(username && { username }),
      } as BannerSettings;
      const query = linkQuery(meta.id, state);
      const url = new URL(
        bannerImageUrl("https://omnivix.example", meta.id, query!, IMAGE_OPTIONS),
      );
      expect(parseLinkSettings(meta.id, Object.fromEntries(url.searchParams))).toEqual({
        settings,
        username,
      });
    });
  }

  it("leaves out the defaults", () => {
    const { initialState } = getTemplates().find(({ meta }) => meta.id === "github-banner")!;
    expect(String(linkQuery("github-banner", { ...initialState, username: "octocat" }))).toBe(
      "username=octocat",
    );
  });

  it("can't link an upload", () => {
    const { initialState } = getTemplates().find(({ meta }) => meta.id === "quote-banner")!;
    expect(
      linkQuery("quote-banner", { ...initialState, logoImage: "data:image/png;base64,AAAA" }),
    ).toBeNull();
  });
});

describe("bannerImageUrl", () => {
  const query = new URLSearchParams({ username: "octocat", contentPosition: "100,0" });

  it("keeps positions readable and leaves out the default ratio and theme", () => {
    expect(bannerImageUrl("https://omnivix.example", "github-banner", query, IMAGE_OPTIONS)).toBe(
      "https://omnivix.example/banner/github-banner.png?username=octocat&contentPosition=100,0",
    );
  });

  it("names the format, ratio and theme when they aren't the defaults", () => {
    expect(
      bannerImageUrl("https://omnivix.example", "github-banner", query, {
        format: "jpeg",
        pixelRatio: 1,
        uiTheme: "light",
      }),
    ).toBe(
      "https://omnivix.example/banner/github-banner.jpg?username=octocat&contentPosition=100,0&pixelRatio=1&uiTheme=light",
    );
  });

  it("names a transparent background on a PNG", () => {
    expect(
      bannerImageUrl("https://omnivix.example", "github-banner", query, {
        ...IMAGE_OPTIONS,
        format: "transparent",
      }),
    ).toBe(
      "https://omnivix.example/banner/github-banner.png?username=octocat&contentPosition=100,0&transparent=true",
    );
  });
});
