import { describe, expect, it } from "vitest";
import { isDefaultLogoPosition, logoFromState } from "./logo";

describe("logoFromState", () => {
  it("is undefined without a logo", () => {
    expect(logoFromState({})).toBeUndefined();
    expect(logoFromState({ logoImage: "" })).toBeUndefined();
  });

  it("starts at the top right, at M, inside the banner's padding", () => {
    expect(logoFromState({ logoImage: "https://example.com/logo.svg", size: "wide" })).toEqual({
      src: "https://example.com/logo.svg",
      position: { x: 100, y: 0 },
      height: 59,
      inset: 32,
    });
  });

  it("scales with the banner height and keeps a moved position", () => {
    expect(
      logoFromState({
        logoImage: "https://example.com/logo.svg",
        size: "header",
        logoSize: "xl",
        logoPosition: { x: 20, y: 140 },
      }),
    ).toMatchObject({ position: { x: 20, y: 100 }, height: 130, inset: 40 });
  });
});

describe("isDefaultLogoPosition", () => {
  it("is true at the top right", () => {
    expect(isDefaultLogoPosition({})).toBe(true);
    expect(isDefaultLogoPosition({ logoPosition: { x: 100, y: 0 } })).toBe(true);
    expect(isDefaultLogoPosition({ logoPosition: { x: 0, y: 0 } })).toBe(false);
  });
});
