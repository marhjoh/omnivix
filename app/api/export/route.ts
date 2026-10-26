import { NextRequest, NextResponse } from "next/server";
import { parseExportRequest } from "@/src/export/payload";
import { resolveExportImages } from "@/src/export/images";
import { createExportToken } from "@/src/export/export-token";
import { getPublicOrigin } from "@/src/export/request-origin";
import { buildRenderUrl } from "@/src/export/render-url";
import { captureBanner } from "@/src/export/playwright";
import { EXPORT_FORMAT, EXPORT_FORMAT_DETAILS } from "@/src/export/format";
import { GithubRateLimitError } from "@/src/github/rateLimit";
import { githubRateLimited, githubUserNotFound } from "@/src/github/route";
import { GithubUserNotFoundError } from "@/src/export/renderProblem";

/** Stay under common proxy URL limits; stateless tokens grow with payload size. */
const MAX_RENDER_URL_LENGTH = 7500;

/** The studio only sends an invalid request when its state is stale; others read `issues`. */
const INVALID_REQUEST = "Couldn't export this banner. Reload the page and try again.";

export const runtime = "nodejs";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = parseExportRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: INVALID_REQUEST, issues: parsed.issues }, { status: 400 });
  }

  try {
    const resolved = await resolveExportImages(parsed.request);
    if (!resolved.ok) return error(resolved.error, 400);
    const { payload, images } = resolved;

    const token = createExportToken(payload);
    const renderUrl = buildRenderUrl(getPublicOrigin(request), payload.templateId, token);
    if (renderUrl.length > MAX_RENDER_URL_LENGTH) {
      return error("Banner settings are too long to export. Shorten the text.", 413);
    }
    const format = payload.format ?? EXPORT_FORMAT;
    const image = await captureBanner({
      url: renderUrl,
      size: payload.size,
      pixelRatio: payload.pixelRatio,
      format,
      images,
    });
    const { contentType, extension } = EXPORT_FORMAT_DETAILS[format];
    return new NextResponse(new Uint8Array(image), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${payload.templateId}.${extension}"`,
      },
    });
  } catch (exportError) {
    if (exportError instanceof GithubRateLimitError) return githubRateLimited(exportError);
    if (exportError instanceof GithubUserNotFoundError) {
      return githubUserNotFound(String(parsed.request.state.username ?? ""));
    }
    console.error("Export failed", exportError);
    return error("Couldn't export the banner. Try again.", 500);
  }
}
