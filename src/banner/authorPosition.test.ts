import { describe, expect, it } from "vitest";
import {
  authorPositionFromState,
  describeAuthorPosition,
  moveAuthor,
  parseAuthorPositionText,
} from "./authorPosition";

describe("authorPositionFromState", () => {
  it("is undefined while lined up like the quote, or for values out of range", () => {
    expect(authorPositionFromState({ authorPosition: { x: 100, y: 24 } })).toEqual({
      x: 100,
      y: 24,
    });
    expect(authorPositionFromState({ authorPosition: { x: 50, y: -4 } })).toBeUndefined();
    expect(authorPositionFromState({ authorPosition: { x: 120, y: 0 } })).toBeUndefined();
    expect(authorPositionFromState({})).toBeUndefined();
  });
});

describe("parseAuthorPositionText", () => {
  it("reads `x,y`", () => {
    expect(parseAuthorPositionText("100,24")).toEqual({ x: 100, y: 24 });
    expect(parseAuthorPositionText("100")).toBeNull();
    expect(parseAuthorPositionText("100,")).toBeNull();
    expect(parseAuthorPositionText("50,-10")).toBeNull();
  });
});

describe("describeAuthorPosition", () => {
  it("says where across the quote, and how much lower", () => {
    expect(describeAuthorPosition({ x: 0, y: 0 })).toBe("left, right under the quote");
    expect(describeAuthorPosition({ x: 37.4, y: 24 })).toBe("37% across, 24 pixels lower");
  });
});

describe("moveAuthor", () => {
  /** 400px for the author to move across, 60px for it to move down. */
  const room = { width: 400, height: 60 };

  it("follows the pointer", () => {
    expect(moveAuthor({ x: 0, y: 0 }, { x: 100, y: 20.4 }, room)).toEqual({
      position: { x: 25, y: 20 },
      snapped: {},
    });
  });

  it("stays across the quote and inside the padding", () => {
    expect(moveAuthor({ x: 50, y: 10 }, { x: 900, y: 500 }, room).position).toEqual({
      x: 100,
      y: 70,
    });
    expect(moveAuthor({ x: 50, y: 10 }, { x: -900, y: -500 }, room).position).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("snaps to the quote's edges and center, and right under it", () => {
    expect(moveAuthor({ x: 0, y: 30 }, { x: 196, y: 0 }, room, 6)).toEqual({
      position: { x: 50, y: 30 },
      snapped: { x: 50 },
    });
    expect(moveAuthor({ x: 0, y: 30 }, { x: 0, y: -25 }, room, 6).position.y).toBe(0);
  });

  it("stays put across when the author is as wide as the quote", () => {
    expect(moveAuthor({ x: 50, y: 0 }, { x: 100, y: 0 }, { width: 0, height: 0 })).toEqual({
      position: { x: 50, y: 0 },
      snapped: {},
    });
  });
});
