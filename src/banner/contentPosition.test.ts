import { describe, expect, it } from "vitest";
import {
  alignmentAt,
  alignmentShown,
  contentPositionFromState,
  contentRoom,
  dragContentPosition,
  isDefaultContentPosition,
  nudgeContentPosition,
  snapLine,
} from "./contentPosition";

/** LinkedIn's 4:1 banner: 32px padding, so a 1520 × 332 box. */
const WIDE = { width: 1584, height: 396 };

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

describe("contentRoom", () => {
  it("is the padded box less the content", () => {
    expect(contentRoom(WIDE, { width: 1000, height: 200 })).toEqual({ width: 520, height: 132 });
    expect(contentRoom(WIDE, { width: 1600, height: 332 })).toEqual({ width: 0, height: 0 });
  });
});

describe("dragContentPosition", () => {
  const room = { width: 1000, height: 200 };

  it("follows the pointer", () => {
    expect(dragContentPosition({ x: 20, y: 20 }, { x: 150, y: -10 }, room, 0)).toEqual({
      position: { x: 35, y: 15 },
      snapped: {},
    });
  });

  it("stops at the padding", () => {
    expect(dragContentPosition({ x: 90, y: 10 }, { x: 500, y: -500 }, room, 0).position).toEqual({
      x: 100,
      y: 0,
    });
  });

  it("snaps to an edge or the middle, and says which", () => {
    expect(dragContentPosition({ x: 20, y: 20 }, { x: 295, y: 0 }, room, 6)).toEqual({
      position: { x: 50, y: 20 },
      snapped: { x: 50 },
    });
    expect(dragContentPosition({ x: 20, y: 20 }, { x: 0, y: -35 }, room, 4)).toEqual({
      position: { x: 20, y: 2.5 },
      snapped: {},
    });
    expect(dragContentPosition({ x: 20, y: 20 }, { x: 0, y: -38 }, room, 4).snapped).toEqual({
      y: 0,
    });
  });

  it("leaves an axis without room as it is", () => {
    expect(
      dragContentPosition({ x: 50, y: 50 }, { x: 100, y: 100 }, { width: 0, height: 200 }, 0)
        .position,
    ).toEqual({ x: 50, y: 100 });
  });
});

describe("nudgeContentPosition", () => {
  it("steps on axes with room, within 0 to 100", () => {
    const room = { width: 1000, height: 0 };
    expect(nudgeContentPosition({ x: 50, y: 50 }, { x: 2, y: 0 }, room)).toEqual({ x: 52, y: 50 });
    expect(nudgeContentPosition({ x: 95, y: 50 }, { x: 10, y: 0 }, room)).toEqual({
      x: 100,
      y: 50,
    });
    expect(nudgeContentPosition({ x: 50, y: 50 }, { x: 0, y: 10 }, room)).toEqual({ x: 50, y: 50 });
  });
});

describe("snapLine", () => {
  it("is the padded box's edge or middle", () => {
    expect(snapLine(WIDE, "x", 0)).toBe(32);
    expect(snapLine(WIDE, "x", 50)).toBe(792);
    expect(snapLine(WIDE, "x", 100)).toBe(1552);
    expect(snapLine(WIDE, "y", 100)).toBe(364);
  });
});
