import { describe, expect, it } from "vitest";
import { listText, truncateMiddle } from "./text";

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

describe("truncateMiddle", () => {
  it("leaves short text", () => {
    expect(truncateMiddle("abc", 10)).toBe("abc");
  });

  it("keeps the start and end of long text", () => {
    expect(truncateMiddle("https://example.com/very/long/path/to/file.jpg", 20)).toBe(
      "https://e…file.jpg",
    );
  });
});
