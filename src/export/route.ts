import { NextResponse, type NextRequest } from "next/server";
import { parseExportRequest, type ParsedExportRequest } from "@/src/export/payload";
import { resolveExportImages } from "@/src/export/images";
import { createExportToken } from "@/src/export/export-token";
import { getPublicOrigin } from "@/src/export/request-origin";
import { buildRenderUrl } from "@/src/export/render-url";
import { captureBanner } from "@/src/export/playwright";
import { EXPORT_FORMAT_DETAILS, type ExportFormat } from "@/src/export/format";
import { GithubUserNotFoundError } from "@/src/export/renderProblem";
import { GithubRateLimitError } from "@/src/github/rateLimit";
import { githubUserNotFound } from "@/src/github/route";
import { dailyExportLimit, tooManyRequests } from "@/src/lib/requestLimits";
import type { ExportRequest, TemplateId } from "@/src/types/template";

/** Stay under common proxy URL limits; stateless tokens grow with payload size. */
const MAX_RENDER_URL_LENGTH = 7500;

/** The studio only sends an invalid request when its state is stale; others read `issues`. */
const INVALID_REQUEST = "Couldn't export this banner. Reload the page and try again.";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * The export API: checks the request and the visitor's daily quota, then renders the banner in a
 * headless browser and returns it as an image.
 */
export async function exportRoute(request: NextRequest) {
  const parsed = parseExportRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: INVALID_REQUEST, issues: parsed.issues }, { status: 400 });
  }
  const limitedUntil = await dailyExportLimit(request);
  if (limitedUntil) return tooManyRequests("daily-exports", limitedUntil);

  try {
    return await renderExport(request, parsed.request);
  } catch (exportError) {
    return exportFailure(exportError, parsed.request);
  }
}

async function renderExport(request: NextRequest, exportRequest: ParsedExportRequest) {
  const resolved = await resolveExportImages(exportRequest);
  if (!resolved.ok) return error(resolved.error, 400);
  const { payload, images } = resolved;

  const token = createExportToken(payload);
  const renderUrl = buildRenderUrl(getPublicOrigin(request), payload.templateId, token);
  if (renderUrl.length > MAX_RENDER_URL_LENGTH) {
    return error("Banner settings are too long to export. Shorten the text.", 413);
  }
  const image = await captureBanner({
    url: renderUrl,
    size: payload.size,
    pixelRatio: payload.pixelRatio,
    format: payload.format,
    images,
  });
  return imageResponse(image, payload.format, payload.templateId);
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

/** The render page loads GitHub data, so its GitHub problems reach the export too. */
function exportFailure(exportError: unknown, exportRequest: ExportRequest) {
  if (exportError instanceof GithubRateLimitError) {
    return tooManyRequests("github", exportError.resetAt);
  }
  if (exportError instanceof GithubUserNotFoundError) {
    return githubUserNotFound(String(exportRequest.state.username ?? ""));
  }
  console.error("Export failed", exportError);
  return error("Couldn't export the banner. Try again.", 500);
}
