import { describe, expect, it } from "vitest";
import { templateRegistry } from "@/src/templates/registry";
import { creditFromState, isDefaultCreditPosition } from "./credit";

const base = templateRegistry["quote-banner"].initialState;

describe("creditFromState", () => {
  it("is off by default", () => {
    expect(base.credit).toBe("off");
    expect(creditFromState(base)).toBeUndefined();
  });

  it("starts at the bottom right, at S, inside the banner's padding", () => {
    expect(creditFromState({ ...base, credit: "badge", size: "wide" })).toEqual({
      style: "badge",
      position: { x: 100, y: 100 },
      height: 24,
      box: { left: 32, top: 32, width: 1520, height: 332 },
    });
  });

  it("scales with the banner height and keeps a moved position", () => {
    expect(
      creditFromState({
        ...base,
        credit: "logo",
        size: "header",
        creditSize: "xl",
        creditPosition: { x: 0, y: 0 },
      }),
    ).toMatchObject({ position: { x: 0, y: 0 }, height: 60 });
  });
});

describe("isDefaultCreditPosition", () => {
  it("is true at the bottom right", () => {
    expect(isDefaultCreditPosition(base)).toBe(true);
    expect(isDefaultCreditPosition({ ...base, creditPosition: { x: 100, y: 100 } })).toBe(true);
    expect(isDefaultCreditPosition({ ...base, creditPosition: { x: 0, y: 100 } })).toBe(false);
  });
});
