import "server-only";
import { Cause, Effect } from "effect";
import { NextResponse, type NextRequest } from "next/server";
import { parseExportRequest, type ParsedExportRequest } from "@/src/export/payload";
import { resolveExportImages } from "@/src/export/images";
import { createExportToken } from "@/src/export/export-token";
import { renderUrl } from "@/src/export/render-url";
import { captureBanner } from "@/src/export/playwright";
import { EXPORT_FORMAT_DETAILS, type ExportFormat } from "@/src/export/format";
import { DailyExportLimitReached, ExportTimedOut, SettingsTooLong } from "@/src/export/errors";
import { githubUserNotFound } from "@/src/github/route";
import { dailyExportLimit, tooManyRequests } from "@/src/lib/requestLimits";
import type { TemplateId } from "@/src/types/template";

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

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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
    return NextResponse.json({ error: INVALID_REQUEST, issues: parsed.issues }, { status: 400 });
  }
  const username = String(parsed.request.state.username ?? "");
  return Effect.runPromise(
    exportBanner(request, parsed.request).pipe(
      Effect.timeoutOrElse({
        duration: EXPORT_DEADLINE,
        orElse: () => Effect.fail(new ExportTimedOut()),
      }),
      Effect.catchTags({
        DailyExportLimitReached: ({ resetAt }) =>
          Effect.succeed(tooManyRequests("daily-exports", resetAt)),
        UnusableImage: ({ message }) => Effect.succeed(error(message, 400)),
        SettingsTooLong: () =>
          Effect.succeed(error("Banner settings are too long to export. Shorten the text.", 413)),
        // The render page loads GitHub data, so its GitHub problems reach the export too.
        GithubLimitReached: ({ resetAt }) => Effect.succeed(tooManyRequests("github", resetAt)),
        GithubUserMissing: () => Effect.succeed(githubUserNotFound(username)),
      }),
      Effect.catchCause((cause) =>
        Effect.sync(() => {
          console.error("Export failed", Cause.pretty(cause));
          return error(EXPORT_FAILED, 500);
        }),
      ),
    ),
  );
}
