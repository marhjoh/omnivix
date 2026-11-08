import "server-only";
import { Cache, Duration, Effect, Exit } from "effect";
import type { Feed } from "@/src/banner/feed";
import { FeedUnreadable } from "@/src/feeds/errors";
import { parseFeed } from "@/src/feeds/parseFeed";
import { FEED_TTL_MS } from "@/src/feeds/cacheTimes";
import { fetchPublic, PublicFetchError, type PublicFetchProblem } from "@/src/lib/publicFetch";
import { megabytes } from "@/src/lib/text";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const FEED_TIMEOUT = "8 seconds";
const CACHE_CAPACITY = 500;

function problemMessage(problem: PublicFetchProblem): string {
  switch (problem) {
    case "invalid-url":
    case "invalid-redirect":
      return "That feed link isn't a valid URL.";
    case "not-https":
    case "insecure-redirect":
      return "Feed links must use https://.";
    case "not-public":
      return "That feed link isn't allowed. Use a public https:// feed.";
    case "not-found":
      return "Couldn't find that feed link.";
    case "unreachable":
      return "Couldn't load the feed.";
    case "bad-status":
      return "Couldn't load that feed. It may have moved or be private.";
    case "rate-limited":
      return "The feed's site is refusing requests for now. Try again later.";
    case "wrong-type":
      return "That link isn't an RSS or Atom feed. Look for the blog's RSS link.";
    case "too-large":
      return `The feed is larger than ${megabytes(MAX_FEED_BYTES)}.`;
    case "too-many-redirects":
      return "The feed link redirects too many times.";
  }
}

function loadFeed(link: string): Effect.Effect<Feed, FeedUnreadable> {
  return Effect.tryPromise({
    try: (signal) =>
      fetchPublic(link, {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        // Some servers send feeds as text/plain.
        acceptsType: (type) => type.includes("xml") || type === "text/plain",
        maxBytes: MAX_FEED_BYTES,
        signal,
      }),
    catch: (error) =>
      new FeedUnreadable({
        message:
          error instanceof PublicFetchError
            ? problemMessage(error.problem)
            : "Couldn't load the feed.",
      }),
  }).pipe(
    Effect.timeoutOrElse({
      duration: FEED_TIMEOUT,
      orElse: () => Effect.fail(new FeedUnreadable({ message: "The feed took too long to load." })),
    }),
    Effect.flatMap(({ body }) => parseFeed(body.toString("utf8"))),
  );
}

/** Concurrent requests for a feed share one download. Failures aren't kept. */
const feeds = Effect.runSync(
  Cache.makeWith(loadFeed, {
    capacity: CACHE_CAPACITY,
    timeToLive: (exit) => (Exit.isSuccess(exit) ? Duration.millis(FEED_TTL_MS) : Duration.zero),
  }),
);

/** A feed's newest posts, downloaded with `fetchPublic`'s rules and cached for FEED_TTL_MS. */
export function getFeed(link: string): Effect.Effect<Feed, FeedUnreadable> {
  return Cache.get(feeds, link);
}
