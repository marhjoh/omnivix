import { describe, expect, it } from "vitest";
import { parsePositionText } from "./position";

describe("parsePositionText", () => {
  it("reads x,y from 0 to 100", () => {
    expect(parsePositionText("100,0")).toEqual({ x: 100, y: 0 });
    expect(parsePositionText("37.5, 20")).toEqual({ x: 37.5, y: 20 });
  });

  it.each(["", "50", "50,", ",50", "a,b", "101,0", "0,-1", "1,2,3"])("rejects %j", (text) => {
    expect(parsePositionText(text)).toBeNull();
  });
});
