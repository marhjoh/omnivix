import { describe, expect, it } from "vitest";
import {
  MAX_BACKGROUND_ZOOM,
  backgroundFromState,
  backgroundImageStyle,
  backgroundPanRange,
  isDefaultBackgroundFraming,
  dragBackgroundPosition,
} from "./background";

describe("backgroundFromState", () => {
  it("is undefined without a background", () => {
    expect(backgroundFromState({})).toBeUndefined();
    expect(backgroundFromState({ backgroundImage: "" })).toBeUndefined();
  });

  it("uses a preset's focus, else the center", () => {
    expect(backgroundFromState({ backgroundImage: "/backgrounds/london.avif" })?.position).toEqual({
      x: 30,
      y: 85,
    });
    expect(backgroundFromState({ backgroundImage: "https://example.com/a.jpg" })).toEqual({
      src: "https://example.com/a.jpg",
      position: { x: 50, y: 50 },
      zoom: 1,
    });
  });

  it("prefers a saved position and zoom", () => {
    const background = backgroundFromState({
      backgroundImage: "/backgrounds/london.avif",
      backgroundPosition: { x: 10, y: 20 },
      backgroundZoom: 1.25,
    });
    expect(background?.position).toEqual({ x: 10, y: 20 });
    expect(background?.zoom).toBe(1.25);
  });

  it("clamps or ignores bad values", () => {
    const background = backgroundFromState({
      backgroundImage: "/x.jpg",
      backgroundPosition: { x: -20, y: 400 },
      backgroundZoom: 9,
    });
    expect(background?.position).toEqual({ x: 0, y: 100 });
    expect(background?.zoom).toBe(MAX_BACKGROUND_ZOOM);
    expect(
      backgroundFromState({
        backgroundImage: "/x.jpg",
        backgroundPosition: "top",
        backgroundZoom: NaN,
      }),
    ).toMatchObject({ position: { x: 50, y: 50 }, zoom: 1 });
  });
});

describe("isDefaultBackgroundFraming", () => {
  const london = "/backgrounds/london.avif";

  it("is true when position and zoom are back at their defaults", () => {
    const state = {
      backgroundImage: london,
      backgroundPosition: { x: 30, y: 85 },
      backgroundZoom: 1,
    };
    expect(isDefaultBackgroundFraming(backgroundFromState(state)!)).toBe(true);
  });

  it("is false once moved or zoomed", () => {
    const moved = { backgroundImage: london, backgroundPosition: { x: 30, y: 70 } };
    const zoomed = { backgroundImage: london, backgroundZoom: 1.2 };
    expect(isDefaultBackgroundFraming(backgroundFromState(moved)!)).toBe(false);
    expect(isDefaultBackgroundFraming(backgroundFromState(zoomed)!)).toBe(false);
  });
});

describe("backgroundImageStyle", () => {
  it("only scales when zoomed", () => {
    const base = { src: "/x.jpg", position: { x: 30, y: 85 } };
    expect(backgroundImageStyle({ ...base, zoom: 1 })).toEqual({ objectPosition: "30% 85%" });
    expect(backgroundImageStyle({ ...base, zoom: 1.5 })).toEqual({
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
