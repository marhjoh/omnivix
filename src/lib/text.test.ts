import { describe, expect, it } from "vitest";
import { listText } from "./text";

describe("listText", () => {
  it.each([
    [[], ""],
    [["PNG"], "PNG"],
    [["PNG", "JPEG"], "PNG or JPEG"],
    [["PNG", "JPEG", "WebP"], "PNG, JPEG or WebP"],
  ])("joins %j", (items, expected) => {
    expect(listText(items)).toBe(expected);
  });

  it("can join with and", () => {
    expect(listText(["YouTube", "Reddit"], "and")).toBe("YouTube and Reddit");
  });
});
