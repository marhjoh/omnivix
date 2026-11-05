import "server-only";
import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import { parseExportRequest, type ParsedExportRequest } from "@/src/export/payload";
import { resolveExportImages } from "@/src/export/images";
import { createExportToken } from "@/src/export/exportToken";
import { captureBanner } from "@/src/export/playwright";
import { EXPORT_FORMAT_DETAILS, type ExportFormat } from "@/src/export/format";
import { DailyExportLimitReached, ExportTimedOut, SettingsTooLong } from "@/src/export/errors";
import { dailyExportLimit } from "@/src/lib/requestLimits";
import { errorResponse, githubErrorResponses, tooManyRequests } from "@/src/lib/apiResponse";
import { usernameOf } from "@/src/lib/githubUsername";
import type { TemplateId } from "@/src/templates/types";

/** Stay under common proxy URL limits; stateless tokens grow with payload size. */
const MAX_RENDER_URL_LENGTH = 7500;

/**
 * The longest a whole export may take, from the quota check to the image. Exports take 6–14 s on
 * Vercel; a stuck one is stopped here, which closes Chromium, instead of running until Vercel
 * ends the function.
 */
const EXPORT_DEADLINE = "45 seconds";

/** The studio only sends an invalid request when its state is stale; others read `issues`. */
const INVALID_REQUEST = "Couldn't export this banner. Reload the page and try again.";

const EXPORT_FAILED = "Couldn't export the banner. Try again.";

/** The render page Playwright opens for this export. */
function renderUrl(request: NextRequest, templateId: string, token: string): string {
  return `${publicOrigin(request)}/render/${templateId}?token=${encodeURIComponent(token)}`;
}

/**
 * Origin Playwright opens the render page on. On Vercel, the forwarded headers are set by the
 * platform and name the public URL users use (right deployment, cookies, auth bypass rules);
 * `nextUrl` can be an internal host there. Elsewhere those headers could come from the client, so
 * the server's own origin is used.
 */
function publicOrigin(request: NextRequest): string {
  if (!process.env.VERCEL) return request.nextUrl.origin;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host) return `https://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return request.nextUrl.origin;
}

function imageResponse(image: Buffer, format: ExportFormat, templateId: TemplateId) {
  const { contentType, extension } = EXPORT_FORMAT_DETAILS[format];
  return new NextResponse(new Uint8Array(image), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${templateId}.${extension}"`,
    },
  });
}

/** Checks the daily quota, then renders the banner in a headless browser. */
const exportBanner = Effect.fnUntraced(function* (
  request: NextRequest,
  exportRequest: ParsedExportRequest,
) {
  const limitedUntil = yield* Effect.promise(() => dailyExportLimit(request));
  if (limitedUntil) return yield* new DailyExportLimitReached({ resetAt: limitedUntil });

  const { payload, images } = yield* resolveExportImages(exportRequest);
  const url = renderUrl(request, payload.templateId, createExportToken(payload));
  if (url.length > MAX_RENDER_URL_LENGTH) return yield* new SettingsTooLong();
  const image = yield* captureBanner({
    url,
    size: payload.size,
    pixelRatio: payload.pixelRatio,
    format: payload.format,
    images,
  });
  return imageResponse(image, payload.format, payload.templateId);
});

/**
 * The export API: checks the request and the visitor's daily quota, then renders the banner in a
 * headless browser and returns it as an image. Each failure becomes its response here; anything
 * unexpected is logged and answers 500.
 */
export async function exportRoute(request: NextRequest): Promise<Response> {
  const parsed = parseExportRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return errorResponse(INVALID_REQUEST, 400, { issues: parsed.issues });
  }
  return Effect.runPromise(
    exportBanner(request, parsed.request).pipe(
      Effect.timeoutOrElse({
        duration: EXPORT_DEADLINE,
        orElse: () => Effect.fail(new ExportTimedOut()),
      }),
      Effect.catchTags({
        DailyExportLimitReached: ({ resetAt }) =>
          Effect.succeed(tooManyRequests("daily-exports", resetAt)),
        UnusableImage: ({ message }) => Effect.succeed(errorResponse(message, 400)),
        SettingsTooLong: () =>
          Effect.succeed(
            errorResponse("Banner settings are too long to export. Shorten the text.", 413),
          ),
        // The render page loads GitHub data, so its GitHub problems reach the export too.
        ...githubErrorResponses(usernameOf(parsed.request.state)),
      }),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error("Export failed", Cause.pretty(cause));
          return errorResponse(EXPORT_FAILED, 500);
        }),
      ),
    ),
  );
}
