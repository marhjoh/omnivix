import "server-only";
import { Effect, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import { MAX_POSTS, type Feed, type FeedPost } from "@/src/banner/feed";
import { FeedUnreadable } from "@/src/feeds/errors";

const TITLE_MAX_LENGTH = 200;

const NOT_A_FEED = "That link isn't an RSS or Atom feed. Look for the blog's RSS link.";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // `dc:date` becomes `date`, and Atom's default namespace doesn't matter.
  removeNSPrefix: true,
  // Titles like "2024" stay text.
  parseTagValue: false,
  htmlEntities: true,
  // Feeds escape their HTML, so they have thousands of entities. Nested DOCTYPE entities, the
  // "billion laughs" attack, stay unexpanded.
  processEntities: {
    maxEntityCount: 100,
    maxExpansionDepth: 1,
    maxTotalExpansions: 100_000,
    maxExpandedLength: 100_000,
  },
  isArray: (name) => name === "item" || name === "entry",
});

/** Text, or a tag with attributes such as Atom's `<title type="html">`. */
const Text = Schema.Union([
  Schema.String,
  Schema.Struct({ "#text": Schema.optional(Schema.String) }),
]);

/** An RSS item or an Atom entry. Only the fields the banner uses are read. */
const Item = Schema.Struct({
  title: Schema.optional(Text),
  pubDate: Schema.optional(Text),
  date: Schema.optional(Text),
  published: Schema.optional(Text),
  updated: Schema.optional(Text),
});
/** An empty `<item></item>` parses as text. */
const Items = Schema.optional(Schema.Array(Schema.Union([Item, Schema.String])));

/** RSS 2.0, RSS 1.0 (RDF) and Atom. */
const Document = Schema.Struct({
  rss: Schema.optional(Schema.Struct({ channel: Schema.Struct({ item: Items }) })),
  RDF: Schema.optional(Schema.Struct({ item: Items })),
  feed: Schema.optional(Schema.Struct({ entry: Items })),
});

function textOf(value: typeof Text.Type | undefined): string {
  return (typeof value === "string" ? value : (value?.["#text"] ?? "")).trim();
}

/** Titles may hold HTML, escaped or in CDATA. Only the words are kept. */
function cleanTitle(title: string): string {
  const words = title
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return words.length > TITLE_MAX_LENGTH ? `${words.slice(0, TITLE_MAX_LENGTH - 1)}…` : words;
}

/** YYYY-MM-DD in UTC, from RSS's RFC 822 dates or Atom's ISO dates. */
function dayOf(text: string): string | null {
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString().slice(0, 10);
}

function postOf(item: typeof Item.Type | string): FeedPost | null {
  if (typeof item === "string") return null;
  const title = cleanTitle(textOf(item.title));
  if (!title) return null;
  const date = textOf(item.pubDate ?? item.published ?? item.date ?? item.updated);
  return { title, date: date ? dayOf(date) : null };
}

/**
 * The newest posts in an RSS or Atom feed. Feeds are usually newest first, but when every post has
 * a date they're sorted to be sure.
 */
export function parseFeed(xml: string): Effect.Effect<Feed, FeedUnreadable> {
  return Effect.try({
    try: () => parser.parse(xml) as unknown,
    catch: () => new FeedUnreadable({ message: NOT_A_FEED }),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(Document)),
    Effect.mapError((error) =>
      error instanceof FeedUnreadable ? error : new FeedUnreadable({ message: NOT_A_FEED }),
    ),
    Effect.flatMap((doc) => {
      const items = doc.rss?.channel.item ?? doc.RDF?.item ?? doc.feed?.entry;
      if (!items) return Effect.fail(new FeedUnreadable({ message: NOT_A_FEED }));
      const posts = items.flatMap((item) => postOf(item) ?? []);
      if (posts.length === 0) {
        return Effect.fail(new FeedUnreadable({ message: "That feed has no posts yet." }));
      }
      const dated = posts.every((post) => post.date !== null);
      const newestFirst = dated ? posts.toSorted((a, b) => b.date!.localeCompare(a.date!)) : posts;
      return Effect.succeed({ posts: newestFirst.slice(0, MAX_POSTS) });
    }),
  );
}
