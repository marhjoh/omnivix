import { describe, expect, it } from "vitest";
import { Effect, Result } from "effect";
import { parseFeed } from "./parseFeed";

const parse = (xml: string) => Effect.runSync(Effect.result(parseFeed(xml)));

function posts(xml: string) {
  const result = parse(xml);
  if (Result.isFailure(result)) throw new Error(result.failure.message);
  return result.success.posts;
}

function problem(xml: string) {
  const result = parse(xml);
  return Result.isFailure(result) ? result.failure.message : null;
}

describe("parseFeed", () => {
  it("reads RSS 2.0, with CDATA, entities and HTML in titles", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel><title>Blog</title>
        <item><title><![CDATA[Ship <em>it</em>]]></title><pubDate>Sat, 07 Nov 2026 09:00:00 GMT</pubDate></item>
        <item><title>Tom &amp; Jerry&#8217;s 2024</title><pubDate>Mon, 02 Mar 2026 10:00:00 +0100</pubDate></item>
      </channel></rss>`;
    expect(posts(xml)).toEqual([
      { title: "Ship it", date: "2026-11-07" },
      { title: "Tom & Jerry’s 2024", date: "2026-03-02" },
    ]);
  });

  it("reads Atom, with an HTML title and the published date", () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
      <entry><title type="html">A &lt;b&gt;bold&lt;/b&gt; idea</title>
        <published>2026-10-01T12:00:00Z</published><updated>2026-10-05T12:00:00Z</updated></entry>
    </feed>`;
    expect(posts(xml)).toEqual([{ title: "A bold idea", date: "2026-10-01" }]);
  });

  it("reads RSS 1.0 with Dublin Core dates", () => {
    const xml = `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns="http://purl.org/rss/1.0/">
      <item><title>Old school</title><dc:date>2026-01-15T08:00:00Z</dc:date></item>
    </rdf:RDF>`;
    expect(posts(xml)).toEqual([{ title: "Old school", date: "2026-01-15" }]);
  });

  it("sorts dated posts newest first and keeps at most six", () => {
    const items = [3, 9, 1, 7, 5, 8, 2]
      .map((day) => `<item><title>Day ${day}</title><pubDate>2026-05-0${day}</pubDate></item>`)
      .join("");
    const result = posts(`<rss><channel>${items}</channel></rss>`);
    expect(result.map((post) => post.title)).toEqual([
      "Day 9",
      "Day 8",
      "Day 7",
      "Day 5",
      "Day 3",
      "Day 2",
    ]);
  });

  it("keeps the feed's order when a post has no date", () => {
    const xml = `<rss><channel>
      <item><title>First</title></item>
      <item><title>Second</title><pubDate>2026-05-09</pubDate></item>
    </channel></rss>`;
    expect(posts(xml)).toEqual([
      { title: "First", date: null },
      { title: "Second", date: "2026-05-09" },
    ]);
  });

  it("skips posts without a title", () => {
    const xml = `<rss><channel><item><title> </title></item><item><title>Kept</title></item></channel></rss>`;
    expect(posts(xml)).toEqual([{ title: "Kept", date: null }]);
  });

  it("explains a feed without posts", () => {
    expect(problem(`<rss><channel><title>Empty</title><item></item></channel></rss>`)).toBe(
      "That feed has no posts yet.",
    );
  });

  it.each([
    ["a web page", "<!doctype html><html><body><h1>Blog</h1></body></html>"],
    ["JSON", '{"items": []}'],
    ["plain text", "hello"],
  ])("rejects %s", (_, text) => {
    expect(problem(text)).toBe(
      "That link isn't an RSS or Atom feed. Look for the blog's RSS link.",
    );
  });

  it("reads a feed with thousands of escaped characters in its posts", () => {
    const content = "&lt;p&gt;Tom &amp; Jerry&lt;/p&gt;".repeat(1000);
    const xml = `<rss><channel><item><title>Long</title><description>${content}</description></item></channel></rss>`;
    expect(posts(xml)).toEqual([{ title: "Long", date: null }]);
  });

  it("doesn't expand an entity bomb", () => {
    const bomb = `<?xml version="1.0"?>
      <!DOCTYPE rss [
        <!ENTITY a "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
        <!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">
        <!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;">
        <!ENTITY d "&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;">
      ]>
      <rss><channel><item><title>&d;&d;&d;&d;&d;&d;&d;&d;&d;&d;</title></item></channel></rss>`;
    const result = parse(bomb);
    const title = Result.isSuccess(result) ? (result.success.posts[0]?.title ?? "") : "";
    expect(title.length).toBeLessThanOrEqual(200);
  });
});
