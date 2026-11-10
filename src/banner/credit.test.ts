import { describe, expect, it } from "vitest";
import { templateRegistry } from "@/src/templates/registry";
import { creditFromState, isDefaultCreditPosition } from "./credit";

const base = templateRegistry["quote-banner"].initialState;

describe("creditFromState", () => {
  it("is none by default", () => {
    expect(base.credit).toBe("none");
    expect(creditFromState(base)).toBeUndefined();
  });

  it("shows the logo at the bottom right, at S, inside the banner's padding", () => {
    expect(creditFromState({ ...base, credit: "chip", size: "wide" })).toEqual({
      style: "chip",
      content: "logo",
      haze: 0,
      position: { x: 100, y: 100 },
      height: 20,
      box: { left: 32, top: 32, width: 1520, height: 332 },
    });
  });

  it("scales with the banner height and keeps a moved position", () => {
    expect(
      creditFromState({
        ...base,
        credit: "stacked",
        creditContent: "repo",
        size: "header",
        creditSize: "xl",
        creditPosition: { x: 0, y: 0 },
      }),
    ).toMatchObject({ content: "repo", position: { x: 0, y: 0 }, height: 48 });
  });

  it("hazes only photos stronger than the default opacity", () => {
    const photo = { ...base, credit: "stacked", backgroundImage: "/backgrounds/chicago.avif" };
    expect(creditFromState({ ...photo, credit: "stacked" })?.haze).toBe(0);
    expect(creditFromState({ ...photo, credit: "stacked", backgroundOpacity: 64 })?.haze).toBe(0.5);
    expect(creditFromState({ ...photo, credit: "stacked", backgroundOpacity: 100 })?.haze).toBe(1);
  });
});

describe("isDefaultCreditPosition", () => {
  it("is true at the bottom right", () => {
    expect(isDefaultCreditPosition(base)).toBe(true);
    expect(isDefaultCreditPosition({ ...base, creditPosition: { x: 100, y: 100 } })).toBe(true);
    expect(isDefaultCreditPosition({ ...base, creditPosition: { x: 0, y: 100 } })).toBe(false);
  });
});
