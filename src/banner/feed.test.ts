import { describe, expect, it } from "vitest";
import { feedApiUrl, feedLinkFrom, isFeedLink } from "./feed";

const link = (input: string) => {
  const result = feedLinkFrom(input);
  return result.ok ? result.link : result.message;
};

describe("feedLinkFrom", () => {
  it.each([
    ["dev.to/ada", "https://dev.to/feed/ada"],
    ["https://dev.to/ada/my-first-post-1abc", "https://dev.to/feed/ada"],
    ["https://dev.to/feed/ada", "https://dev.to/feed/ada"],
    ["medium.com/@ada", "https://medium.com/feed/@ada"],
    ["https://ada.medium.com/", "https://ada.medium.com/feed"],
    ["ada.hashnode.dev", "https://ada.hashnode.dev/rss.xml"],
    ["https://ada.substack.com", "https://ada.substack.com/feed"],
    ["www.dev.to/ada", "https://dev.to/feed/ada"],
  ])("turns the profile link %s into its feed", (input, feed) => {
    expect(link(input)).toBe(feed);
  });

  it("keeps other links and adds https://", () => {
    expect(link(" example.com/blog/feed.xml ")).toBe("https://example.com/blog/feed.xml");
    expect(link("https://ada.medium.com/some-post")).toBe("https://ada.medium.com/some-post");
  });

  it.each([
    ["http://example.com/feed", "Feed links must use https://."],
    ["not a link", "That isn't a link."],
    ["localhost", "That isn't a link."],
    ["ftp://example.com/feed", "That isn't a link."],
    [`example.com/${"a".repeat(500)}`, "That link is too long."],
  ])("rejects %s", (input, message) => {
    expect(link(input)).toBe(message);
  });
});

describe("isFeedLink and feedApiUrl", () => {
  it("only take https links", () => {
    expect(isFeedLink("https://example.com/feed")).toBe(true);
    expect(isFeedLink("http://example.com/feed")).toBe(false);
    expect(isFeedLink("")).toBe(false);
    expect(feedApiUrl("https://example.com/feed?a=1")).toBe(
      "/api/feed?url=https%3A%2F%2Fexample.com%2Ffeed%3Fa%3D1",
    );
    expect(feedApiUrl("")).toBeNull();
  });
});
