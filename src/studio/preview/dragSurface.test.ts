import { describe, expect, it } from "vitest";
import { describePosition } from "./dragSurface";

describe("describePosition", () => {
  it("names the edges and the middle", () => {
    expect(describePosition({ x: 0, y: 0 })).toBe("left, top");
    expect(describePosition({ x: 50, y: 50 })).toBe("center, middle");
    expect(describePosition({ x: 100, y: 100 })).toBe("right, bottom");
  });

  it("gives whole percentages in between", () => {
    expect(describePosition({ x: 37.4, y: 100 })).toBe("37% from the left, bottom");
    expect(describePosition({ x: 0, y: 20.6 })).toBe("left, 21% from the top");
  });
});
