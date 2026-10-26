import { describe, expect, it } from "vitest";
import {
  dragPlacement,
  nudgePlacement,
  placementRoom,
  placementStyle,
  snapLine,
} from "./placement";

/** LinkedIn's 4:1 banner: 32px padding, so a 1520 × 332 box. */
const WIDE = { width: 1584, height: 396 };

describe("placementStyle", () => {
  it("puts the item's own point on the box's", () => {
    expect(placementStyle({ x: 100, y: 0 })).toMatchObject({
      left: "100%",
      top: "0%",
      transform: "translate(-100%, -0%)",
    });
  });
});

describe("placementRoom", () => {
  it("is the padded box less the item", () => {
    expect(placementRoom(WIDE, { width: 1000, height: 200 })).toEqual({ width: 520, height: 132 });
    expect(placementRoom(WIDE, { width: 1600, height: 332 })).toEqual({ width: 0, height: 0 });
  });
});

describe("dragPlacement", () => {
  const room = { width: 1000, height: 200 };

  it("follows the pointer", () => {
    expect(dragPlacement({ x: 20, y: 20 }, { x: 150, y: -10 }, room, 0)).toEqual({
      position: { x: 35, y: 15 },
      snapped: {},
    });
  });

  it("stops at the padding", () => {
    expect(dragPlacement({ x: 90, y: 10 }, { x: 500, y: -500 }, room, 0).position).toEqual({
      x: 100,
      y: 0,
    });
  });

  it("snaps to an edge or the middle, and says which", () => {
    expect(dragPlacement({ x: 20, y: 20 }, { x: 295, y: 0 }, room, 6)).toEqual({
      position: { x: 50, y: 20 },
      snapped: { x: 50 },
    });
    expect(dragPlacement({ x: 20, y: 20 }, { x: 0, y: -35 }, room, 4)).toEqual({
      position: { x: 20, y: 2.5 },
      snapped: {},
    });
    expect(dragPlacement({ x: 20, y: 20 }, { x: 0, y: -38 }, room, 4).snapped).toEqual({
      y: 0,
    });
  });

  it("leaves an axis without room as it is", () => {
    expect(
      dragPlacement({ x: 50, y: 50 }, { x: 100, y: 100 }, { width: 0, height: 200 }, 0).position,
    ).toEqual({ x: 50, y: 100 });
  });
});

describe("nudgePlacement", () => {
  it("steps on axes with room, within 0 to 100", () => {
    const room = { width: 1000, height: 0 };
    expect(nudgePlacement({ x: 50, y: 50 }, { x: 2, y: 0 }, room)).toEqual({ x: 52, y: 50 });
    expect(nudgePlacement({ x: 95, y: 50 }, { x: 10, y: 0 }, room)).toEqual({
      x: 100,
      y: 50,
    });
    expect(nudgePlacement({ x: 50, y: 50 }, { x: 0, y: 10 }, room)).toEqual({ x: 50, y: 50 });
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
