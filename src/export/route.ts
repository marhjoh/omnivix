import "server-only";
import type { NextRequest } from "next/server";
import { parseExportRequest } from "@/src/export/payload";
import { renderBanner } from "@/src/export/renderBanner";
import { EXPORT_FORMAT_DETAILS } from "@/src/export/format";
import { dailyExportLimit } from "@/src/lib/requestLimits";
import { errorResponse } from "@/src/lib/apiResponse";

/**
 * The studio only sends an invalid request when its state is stale. Other callers can read
 * `issues`.
 */
const INVALID_REQUEST = "Couldn't export this banner. Reload the page and try again.";

/**
 * The export API. It checks the request and the visitor's daily quota, then renders the banner and
 * returns it as a download.
 */
export async function exportRoute(request: NextRequest): Promise<Response> {
  const parsed = parseExportRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return errorResponse(INVALID_REQUEST, 400, { issues: parsed.issues });
  }
  const { templateId, format } = parsed.request;
  return renderBanner(request, parsed.request, {
    source: "download",
    limit: "daily-exports",
    limitedUntil: () => dailyExportLimit(request),
    headers: {
      "Content-Disposition": `attachment; filename="${templateId}.${EXPORT_FORMAT_DETAILS[format].extension}"`,
    },
  });
}
