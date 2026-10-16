import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/src/export/payload";
import { resolveExportBackground } from "@/src/export/background";
import { createExportToken } from "@/src/export/export-token";
import { getPublicOrigin } from "@/src/export/request-origin";
import { buildRenderUrl } from "@/src/export/render-url";
import { captureBannerPng } from "@/src/export/playwright";
import { templateRegistry } from "@/src/templates/registry";

/** Stay under common proxy URL limits; stateless tokens grow with payload size. */
const MAX_RENDER_URL_LENGTH = 7500;

/** The studio sent something it never would; reloading gets a fresh, valid state. */
const INVALID_REQUEST = "Couldn't export this banner. Reload the page and try again.";

export const runtime = "nodejs";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = exportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(INVALID_REQUEST, 400);

  // The same checks the studio runs (text limits, choices, required username), plus their
  // defaults. Unknown keys are kept, so nothing a renderer reads is dropped.
  const { stateSchema } = templateRegistry[parsed.data.templateId];
  const state = stateSchema.safeParse(parsed.data.state);
  if (!state.success) return error(INVALID_REQUEST, 400);

  try {
    const resolved = await resolveExportBackground({
      ...parsed.data,
      state: { ...parsed.data.state, ...state.data },
    });
    if (!resolved.ok) return error(resolved.error, 400);
    const { payload, background } = resolved;

    const token = createExportToken(payload);
    const renderUrl = buildRenderUrl(getPublicOrigin(request), payload.templateId, token);
    if (renderUrl.length > MAX_RENDER_URL_LENGTH) {
      return error("Banner settings are too long to export. Shorten the text.", 413);
    }
    const pngBuffer = await captureBannerPng({
      url: renderUrl,
      size: payload.size,
      pixelRatio: payload.pixelRatio,
      background,
    });
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${payload.templateId}.png"`,
      },
    });
  } catch (exportError) {
    console.error("Export failed", exportError);
    return error("Couldn't export the banner. Try again.", 500);
  }
}
