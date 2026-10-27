import { describe, expect, it } from "vitest";
import {
  alignmentAt,
  alignmentShown,
  contentPositionFromState,
  isDefaultContentPosition,
} from "./contentPosition";

describe("contentPositionFromState", () => {
  it("follows the alignment, centered vertically, until the content is moved", () => {
    expect(contentPositionFromState({})).toEqual({ x: 50, y: 50 });
    expect(contentPositionFromState({ alignment: "left" })).toEqual({ x: 0, y: 50 });
    expect(contentPositionFromState({ alignment: "right" })).toEqual({ x: 100, y: 50 });
  });

  it("uses a moved position, kept between 0 and 100", () => {
    expect(
      contentPositionFromState({ alignment: "left", contentPosition: { x: 30, y: 10 } }),
    ).toEqual({ x: 30, y: 10 });
    expect(contentPositionFromState({ contentPosition: { x: -5, y: 140 } })).toEqual({
      x: 0,
      y: 100,
    });
    expect(contentPositionFromState({ contentPosition: { x: "a", y: 10 } })).toEqual({
      x: 50,
      y: 50,
    });
  });
});

describe("alignmentAt", () => {
  it("names the left, the center and the right, and nothing between", () => {
    expect(alignmentAt(0)).toBe("left");
    expect(alignmentAt(50)).toBe("center");
    expect(alignmentAt(100)).toBe("right");
    expect(alignmentAt(37)).toBeUndefined();
  });
});

describe("alignmentShown", () => {
  it("names only the three spots, centered vertically", () => {
    expect(alignmentShown({ x: 0, y: 50 })).toBe("left");
    expect(alignmentShown({ x: 100, y: 50 })).toBe("right");
    expect(alignmentShown({ x: 0, y: 0 })).toBeUndefined();
    expect(alignmentShown({ x: 37, y: 50 })).toBeUndefined();
  });
});

describe("isDefaultContentPosition", () => {
  it("is true at the alignment, centered vertically", () => {
    expect(isDefaultContentPosition({ alignment: "right" })).toBe(true);
    expect(
      isDefaultContentPosition({ alignment: "right", contentPosition: { x: 100, y: 50 } }),
    ).toBe(true);
    expect(
      isDefaultContentPosition({ alignment: "right", contentPosition: { x: 100, y: 0 } }),
    ).toBe(false);
    expect(isDefaultContentPosition({ alignment: "left", contentPosition: { x: 30, y: 50 } })).toBe(
      false,
    );
  });
});
