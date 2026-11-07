import { describe, expect, it } from "vitest";
import { templateRegistry } from "@/src/templates/registry";
import {
  backgroundFromState,
  backgroundImageStyle,
  backgroundPanRange,
  isDefaultBackgroundPosition,
  dragBackgroundPosition,
  nudgeBackgroundPosition,
} from "./background";

const defaults = templateRegistry["quote-banner"].initialState;

describe("backgroundFromState", () => {
  it("is undefined without a background", () => {
    expect(backgroundFromState(defaults)).toBeUndefined();
    expect(backgroundFromState({ ...defaults, backgroundImage: "" })).toBeUndefined();
  });

  it("uses a preset's focus, else the center", () => {
    expect(
      backgroundFromState({ ...defaults, backgroundImage: "/backgrounds/london.avif" })?.position,
    ).toEqual({ x: 30, y: 85 });
    expect(
      backgroundFromState({ ...defaults, backgroundImage: "https://example.com/a.jpg" }),
    ).toEqual({
      src: "https://example.com/a.jpg",
      position: { x: 50, y: 50 },
      zoom: 1,
      opacity: 28,
    });
  });

  it("prefers a saved position, zoom and opacity", () => {
    const background = backgroundFromState({
      ...defaults,
      backgroundImage: "/backgrounds/london.avif",
      backgroundPosition: { x: 10, y: 20 },
      backgroundZoom: 1.25,
      backgroundOpacity: 0,
    });
    expect(background?.position).toEqual({ x: 10, y: 20 });
    expect(background?.zoom).toBe(1.25);
    expect(background?.opacity).toBe(0);
  });
});

describe("isDefaultBackgroundPosition", () => {
  const london = "/backgrounds/london.avif";

  it("is true at the preset's focus, whatever the zoom and opacity", () => {
    const state = {
      ...defaults,
      backgroundImage: london,
      backgroundPosition: { x: 30, y: 85 },
      backgroundZoom: 1.2,
      backgroundOpacity: 60,
    };
    expect(isDefaultBackgroundPosition(backgroundFromState(state)!)).toBe(true);
  });

  it("is false once moved", () => {
    const moved = { ...defaults, backgroundImage: london, backgroundPosition: { x: 30, y: 70 } };
    expect(isDefaultBackgroundPosition(backgroundFromState(moved)!)).toBe(false);
  });
});

describe("backgroundImageStyle", () => {
  it("only scales when zoomed", () => {
    const base = { src: "/x.jpg", position: { x: 30, y: 85 }, opacity: 40 };
    expect(backgroundImageStyle({ ...base, zoom: 1 })).toEqual({
      opacity: 0.4,
      objectPosition: "30% 85%",
    });
    expect(backgroundImageStyle({ ...base, zoom: 1.5 })).toEqual({
      opacity: 0.4,
      objectPosition: "30% 85%",
      transform: "scale(1.5)",
      transformOrigin: "30% 85%",
    });
  });
});

describe("backgroundPanRange", () => {
  const wide = { width: 1584, height: 396 };
  const photo = { width: 4800, height: 3200 };

  it("only has vertical room for a 3:2 photo in a 4:1 banner", () => {
    expect(backgroundPanRange(wide, photo, 1)).toEqual({ width: 0, height: 1056 - 396 });
  });

  it("gains room on both axes when zoomed", () => {
    const range = backgroundPanRange(wide, photo, 1.5);
    expect(range.width).toBeCloseTo(1584 * 0.5);
    expect(range.height).toBeCloseTo(1056 * 1.5 - 396);
  });
});

describe("dragBackgroundPosition", () => {
  const range = { width: 0, height: 660 };

  it("moves against the drag, in proportion to the room", () => {
    // Dragging down by half the room shows more of the top: y drops by 50 points.
    expect(dragBackgroundPosition({ x: 50, y: 60 }, { x: 0, y: 330 }, range)).toEqual({
      x: 50,
      y: 10,
    });
  });

  it("leaves axes without room alone and clamps to the edges", () => {
    expect(dragBackgroundPosition({ x: 50, y: 60 }, { x: 999, y: -9999 }, range)).toEqual({
      x: 50,
      y: 100,
    });
  });
});

describe("nudgeBackgroundPosition", () => {
  const room = { width: 200, height: 100 };

  it("moves the image the arrow's way, so the position goes the other way", () => {
    // → shows more of the left side: x drops.
    expect(nudgeBackgroundPosition({ x: 50, y: 50 }, { x: 2, y: 0 }, room)).toEqual({
      x: 48,
      y: 50,
    });
    expect(nudgeBackgroundPosition({ x: 50, y: 50 }, { x: 0, y: -10 }, room)).toEqual({
      x: 50,
      y: 60,
    });
  });

  it("stays within 0 to 100, rounded to 0.1", () => {
    expect(nudgeBackgroundPosition({ x: 1, y: 95 }, { x: 2, y: -10 }, room)).toEqual({
      x: 0,
      y: 100,
    });
    expect(nudgeBackgroundPosition({ x: 33.333, y: 50 }, { x: 2, y: 0 }, room)).toEqual({
      x: 31.3,
      y: 50,
    });
  });

  it("leaves an axis without room to move as it is, like a drag", () => {
    // A cover image at zoom 1 fills one axis exactly, so it can't pan that way.
    const tall = { width: 0, height: 100 };
    expect(nudgeBackgroundPosition({ x: 50, y: 50 }, { x: 2, y: 2 }, tall)).toEqual({
      x: 50,
      y: 48,
    });
  });
});
