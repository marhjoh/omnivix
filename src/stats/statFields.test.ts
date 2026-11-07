import { describe, expect, it } from "vitest";
import { breakdown, exportFields, failureFields } from "./statFields";

const banner = {
  templateId: "contribution-banner",
  size: "wide",
  format: "png",
  state: { themeId: "sunset", backgroundImage: "/backgrounds/seoul.avif" },
} as const;

describe("exportFields", () => {
  it("counts the export by source, template, size, format, theme and background", () => {
    expect(exportFields("download", { ...banner, uiTheme: "light" }, 7.2)).toEqual([
      "exports",
      "exports:seconds:8",
      "exports:source:download",
      "exports:template:contribution-banner",
      "exports:size:wide",
      "exports:format:png",
      "exports:ui-theme:light",
      "exports:background:seoul",
      "exports:grid-colors:sunset",
    ]);
  });

  it.each([
    [undefined, "none"],
    ["", "none"],
    ["data:image/png;base64,AAAA", "upload"],
    ["https://example.com/photo.jpg?user=me", "link"],
    ["/backgrounds/unknown.avif", "other"],
  ])("never stores the image itself (%s)", (backgroundImage, kind) => {
    const fields = exportFields("image-url", { ...banner, state: { backgroundImage } }, 60);
    expect(fields).toContain(`exports:background:${kind}`);
    expect(fields).toContain("exports:ui-theme:dark");
    expect(fields).toContain("exports:seconds:45");
    expect(fields.some((field) => field.startsWith("exports:grid-colors"))).toBe(false);
  });

  it("counts a transparent PNG as its own format", () => {
    const fields = exportFields("download", { ...banner, transparent: true }, 7);
    expect(fields).toContain("exports:format:transparent");
    expect(fields).not.toContain("exports:format:png");
  });
});

describe("failureFields", () => {
  it("keeps the first line of the message, without links", () => {
    const message =
      "RenderFailed: page.goto: net::ERR_FAILED at https://omnivix.app/render/x?token=secret\n  at stack";
    expect(failureFields(message)).toEqual([
      "failures",
      "failures:message:RenderFailed: page.goto: net::ERR_FAILED at <url>",
    ]);
  });

  it("shortens long messages", () => {
    const [, field] = failureFields("x".repeat(500));
    expect(field.length).toBe("failures:message:".length + 120);
  });
});

describe("breakdown", () => {
  it("lists one series, most first and ties by name", () => {
    const totals = {
      exports: 9,
      "exports:size:wide": 2,
      "exports:size:header": 5,
      "exports:size:card": 2,
      "exports:template:github-banner": 9,
    };
    expect(breakdown(totals, "exports:size")).toEqual([
      ["header", 5],
      ["card", 2],
      ["wide", 2],
    ]);
  });
});
