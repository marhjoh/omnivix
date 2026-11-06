import "server-only";
import { Effect, Schema } from "effect";
import type { NextRequest } from "next/server";
import { sameText } from "@/src/lib/sameText";
import { getSiteUrl } from "@/src/lib/site";
import {
  LIGHTHOUSE_CATEGORIES,
  LIGHTHOUSE_PAGES,
  lighthouseField,
  saveQuality,
} from "@/src/stats/quality";

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** PageSpeed Insights often takes 20–40 s for a page. */
const REQUEST_TIMEOUT = "120 seconds";

class PageSpeedFailed extends Schema.TaggedError<PageSpeedFailed>()("PageSpeedFailed", {
  cause: Schema.Defect(),
}) {}

const Category = Schema.Struct({ score: Schema.NullOr(Schema.Number) });

const PageSpeedResult = Schema.Struct({
  lighthouseResult: Schema.Struct({
    categories: Schema.Struct({
      performance: Category,
      accessibility: Category,
      "best-practices": Category,
      seo: Category,
    }),
  }),
});

/** Lighthouse on a phone, from Google's PageSpeed Insights API. */
function pageScores(url: URL) {
  const query = new URLSearchParams({ url: url.toString(), strategy: "mobile" });
  for (const category of LIGHTHOUSE_CATEGORIES) {
    query.append("category", category.toUpperCase().replace("-", "_"));
  }
  // Optional. Without a key, all callers share a small quota.
  const key = process.env.PAGESPEED_API_KEY;
  if (key) query.set("key", key);
  return Effect.tryPromise({
    try: async (signal) => {
      const response = await fetch(`${ENDPOINT}?${query}`, { signal });
      if (!response.ok) throw new Error(`PageSpeed Insights answered HTTP ${response.status}`);
      return (await response.json()) as unknown;
    },
    catch: (cause) => new PageSpeedFailed({ cause }),
  }).pipe(
    Effect.timeoutOrElse({
      duration: REQUEST_TIMEOUT,
      orElse: () =>
        Effect.fail(new PageSpeedFailed({ cause: new Error("PageSpeed Insights took too long") })),
    }),
    Effect.flatMap((body) =>
      Schema.decodeUnknownEffect(PageSpeedResult)(body).pipe(
        Effect.mapError((cause) => new PageSpeedFailed({ cause })),
      ),
    ),
    Effect.map(({ lighthouseResult }) => lighthouseResult.categories),
  );
}

function measure(site: URL) {
  return Effect.forEach(
    Object.entries(LIGHTHOUSE_PAGES),
    ([page, path]) =>
      pageScores(new URL(path, site)).pipe(
        Effect.map((categories) =>
          LIGHTHOUSE_CATEGORIES.flatMap((category) => {
            const { score } = categories[category];
            return score === null
              ? []
              : [[lighthouseField(page, category), Math.round(score * 100)]];
          }),
        ),
      ),
    { concurrency: "unbounded" },
  ).pipe(Effect.map((pages) => Object.fromEntries(pages.flat())));
}

/** The daily Vercel Cron job (vercel.json). Vercel sends `CRON_SECRET` as a bearer token. */
export async function lighthouseCronRoute(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameText(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Effect.runPromise(
    measure(getSiteUrl()).pipe(
      Effect.tap((scores) => Effect.promise(() => saveQuality(scores))),
      Effect.map((scores) => Response.json(scores)),
      Effect.catchTag("PageSpeedFailed", ({ cause }) =>
        Effect.sync(() => {
          console.error("Lighthouse couldn't run", cause);
          return new Response("Lighthouse couldn't run", { status: 502 });
        }),
      ),
    ),
  );
}
