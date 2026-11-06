import "server-only";
import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import type { ParsedExportRequest } from "@/src/export/payload";
import { resolveExportImages, withImagePaths } from "@/src/export/images";
import { createExportToken } from "@/src/export/exportToken";
import { captureBanner } from "@/src/export/playwright";
import { EXPORT_FORMAT_DETAILS } from "@/src/export/format";
import { ExportTimedOut } from "@/src/export/errors";
import type { TimedLimit } from "@/src/lib/apiError";
import { errorResponse, githubErrorResponses, tooManyRequests } from "@/src/lib/apiResponse";
import { usernameOf } from "@/src/lib/githubUsername";
import { countStats, visitorId } from "@/src/stats/stats";
import { exportFields, failureFields, type ExportSource } from "@/src/stats/statFields";

/** The token holds all the settings, and proxies refuse very long URLs. */
const MAX_RENDER_URL_LENGTH = 7500;

/**
 * A render normally takes 6–14 s on Vercel. After this deadline it's stopped and Chromium is
 * closed, instead of running until Vercel ends the function.
 */
const EXPORT_DEADLINE = "45 seconds";

const EXPORT_FAILED = "Couldn't export the banner. Try again.";

function renderUrl(request: NextRequest, templateId: string, token: string): string {
  return `${publicOrigin(request)}/render/${templateId}?token=${encodeURIComponent(token)}`;
}

/**
 * The origin Playwright opens the render page on. On Vercel, the platform sets the forwarded
 * headers to the public URL that users visit. That URL has the right deployment, cookies and auth
 * bypass rules, while `nextUrl` can be an internal host. Elsewhere a client could fake those
 * headers, so the server's own origin is used.
 */
function publicOrigin(request: NextRequest): string {
  if (!process.env.VERCEL) return request.nextUrl.origin;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host) return `https://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return request.nextUrl.origin;
}

/**
 * Renders the banner in Chromium and returns the image or an error response. The export API and
 * image URLs both use it, each with its own limit. The length check runs first, so a request that's
 * too long doesn't count toward the limit.
 */
export async function renderBanner(
  request: NextRequest,
  banner: ParsedExportRequest,
  {
    source,
    limit,
    limitedUntil,
    headers,
  }: {
    source: ExportSource;
    limit: TimedLimit;
    /** The time the limit resets if it's used up, otherwise null. */
    limitedUntil: () => Promise<Date | null>;
    headers: Record<string, string>;
  },
): Promise<Response> {
  const planned = withImagePaths(banner);
  if (
    renderUrl(request, planned.templateId, createExportToken(planned)).length >
    MAX_RENDER_URL_LENGTH
  ) {
    return errorResponse("Banner settings are too long to export. Shorten the text.", 413);
  }
  const resetAt = await limitedUntil();
  if (resetAt) return tooManyRequests(limit, resetAt);
  const startedAt = performance.now();

  return Effect.runPromise(
    Effect.gen(function* () {
      const { payload, images } = yield* resolveExportImages(banner);
      const image = yield* captureBanner({
        url: renderUrl(request, payload.templateId, createExportToken(payload)),
        size: payload.size,
        pixelRatio: payload.pixelRatio,
        format: payload.format,
        transparent: payload.transparent === true,
        images,
      });
      const seconds = (performance.now() - startedAt) / 1000;
      // Image URLs come through GitHub's image proxy, not from a visitor.
      countStats(
        exportFields(source, payload, seconds),
        source === "download" ? { id: visitorId(request), steps: ["export"] } : undefined,
      );
      return new NextResponse(new Uint8Array(image), {
        headers: { "Content-Type": EXPORT_FORMAT_DETAILS[payload.format].contentType, ...headers },
      });
    }).pipe(
      Effect.timeoutOrElse({
        duration: EXPORT_DEADLINE,
        orElse: () => Effect.fail(new ExportTimedOut()),
      }),
      Effect.catchTags({
        UnusableImage: ({ message }) => Effect.succeed(errorResponse(message, 400)),
        // The render page loads the GitHub data and reports these problems.
        ...githubErrorResponses(usernameOf(banner.state)),
      }),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error("Export failed", Cause.pretty(cause));
          countStats(failureFields(failureMessage(Cause.squash(cause))));
          return errorResponse(EXPORT_FAILED, 500);
        }),
      ),
    ),
  );
}

/** The error's tag and message. A failed render's message is its browser error. */
function failureMessage(error: unknown): string {
  const tag = typeof error === "object" && error && "_tag" in error ? String(error._tag) : null;
  const inner = tag && error instanceof Error && error.cause ? error.cause : error;
  const message = inner instanceof Error ? inner.message : String(inner);
  return tag ? `${tag}: ${message}` : message;
}
