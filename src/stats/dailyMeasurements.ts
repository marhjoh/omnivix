import "server-only";
import { Cause, Effect, Exit } from "effect";
import type { NextRequest } from "next/server";
import { sameText } from "@/src/lib/sameText";
import { getSiteUrl } from "@/src/lib/site";
import { lighthouseScores } from "@/src/stats/lighthouse";
import { saveQuality, STARS_FIELD } from "@/src/stats/quality";
import { starCount } from "@/src/stats/stars";

/**
 * The daily Vercel Cron job (vercel.json). It saves the Lighthouse scores and the star total, each
 * even when the other fails. Vercel sends `CRON_SECRET` as a bearer token.
 */
export async function dailyMeasurementsRoute(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameText(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Effect.runPromise(
    Effect.gen(function* () {
      const [scores, stars] = yield* Effect.all(
        [Effect.exit(lighthouseScores(getSiteUrl())), Effect.exit(starCount())],
        { concurrency: "unbounded" },
      );
      const values = {
        ...(Exit.isSuccess(scores) ? scores.value : {}),
        ...(Exit.isSuccess(stars) ? { [STARS_FIELD]: stars.value } : {}),
      };
      const exits: Exit.Exit<unknown, unknown>[] = [scores, stars];
      const causes = exits.flatMap((exit) => (Exit.isFailure(exit) ? [exit.cause] : []));
      for (const cause of causes) console.error("A daily measurement failed", Cause.pretty(cause));
      yield* Effect.promise(() => saveQuality(values));
      return Response.json(values, { status: causes.length ? 502 : 200 });
    }),
  );
}
