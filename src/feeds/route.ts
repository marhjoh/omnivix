import "server-only";
import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import { isFeedLink } from "@/src/banner/feed";
import { getFeed } from "@/src/feeds/client";
import { FEED_TTL_MS } from "@/src/feeds/cacheTimes";
import { errorResponse, tooManyRequests } from "@/src/lib/apiResponse";
import { feedLimit } from "@/src/lib/requestLimits";

const FAILURE = "Couldn't load the feed.";

/**
 * `GET /api/feed?url=`: a feed's newest posts. A feed that can't be read gets a 422 with the
 * reason. The CDN caches the posts as long as the server does.
 */
export async function feedRoute(request: NextRequest): Promise<Response> {
  const link = request.nextUrl.searchParams.get("url") ?? "";
  if (!isFeedLink(link)) return errorResponse("Feed links must use https://.", 400);
  const limitedUntil = await feedLimit(request);
  if (limitedUntil) return tooManyRequests("requests", limitedUntil);
  return Effect.runPromise(
    getFeed(link).pipe(
      Effect.map((feed) =>
        NextResponse.json(feed, {
          headers: { "Cache-Control": `public, s-maxage=${Math.round(FEED_TTL_MS / 1000)}` },
        }),
      ),
      Effect.catchTags({
        FeedUnreadable: ({ message }) => Effect.succeed(errorResponse(message, 422)),
      }),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error(FAILURE, Cause.pretty(cause));
          return errorResponse(FAILURE, 502);
        }),
      ),
    ),
  );
}
