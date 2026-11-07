import { describe, expect, it } from "vitest";
import { templateRegistry } from "@/src/templates/registry";
import { isDefaultLogoPosition, logoFromState } from "./logo";

const base = templateRegistry["quote-banner"].initialState;
const logoImage = "https://example.com/logo.svg";

describe("logoFromState", () => {
  it("is undefined without a logo", () => {
    expect(logoFromState(base)).toBeUndefined();
    expect(logoFromState({ ...base, logoImage: "" })).toBeUndefined();
  });

  it("starts at the top right, at M, inside the banner's padding", () => {
    expect(logoFromState({ ...base, logoImage, size: "wide", logoSize: "m" })).toEqual({
      src: logoImage,
      position: { x: 100, y: 0 },
      height: 59,
      box: { left: 32, top: 32, width: 1520, height: 332 },
    });
  });

  it("scales with the banner height and keeps a moved position", () => {
    expect(
      logoFromState({
        ...base,
        logoImage,
        size: "header",
        logoSize: "xl",
        logoPosition: { x: 20, y: 100 },
      }),
    ).toMatchObject({ position: { x: 20, y: 100 }, height: 130, box: { left: 40, top: 40 } });
  });

  it("is sized and placed by the part every device shows on YouTube", () => {
    expect(logoFromState({ ...base, logoImage, size: "youtube", logoSize: "m" })).toMatchObject({
      height: 63,
    });
  });
});

describe("isDefaultLogoPosition", () => {
  it("is true at the top right", () => {
    expect(isDefaultLogoPosition(base)).toBe(true);
    expect(isDefaultLogoPosition({ ...base, logoPosition: { x: 100, y: 0 } })).toBe(true);
    expect(isDefaultLogoPosition({ ...base, logoPosition: { x: 0, y: 0 } })).toBe(false);
  });
});
