import { describe, expect, it } from "vitest";
import { linkText, listText, truncateMiddle } from "./text";

describe("listText", () => {
  it.each([
    [["PNG", "JPEG"], "PNG or JPEG"],
    [["PNG", "JPEG", "WebP"], "PNG, JPEG or WebP"],
  ])("joins %j", (items, expected) => {
    expect(listText(items)).toBe(expected);
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

describe("linkText", () => {
  it("drops https:// from short links", () => {
    expect(linkText("https://github.com/settings/profile")).toBe("github.com/settings/profile");
  });

  it("shows only the domain of long links", () => {
    expect(
      linkText(
        "https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions",
      ),
    ).toBe("docs.github.com");
  });
});
