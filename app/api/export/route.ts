import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/src/export/payload";
import { resolveExportBackground } from "@/src/export/background";
import { createExportToken } from "@/src/export/session-store";
import { getPublicOrigin } from "@/src/export/request-origin";
import { buildRenderUrl } from "@/src/export/render-url";
import { captureBannerPng } from "@/src/export/playwright";

/** Stay under common proxy URL limits; stateless tokens grow with payload size. */
const MAX_RENDER_URL_LENGTH = 7500;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = exportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export payload" }, { status: 400 });
  }
  const split = await resolveExportBackground(parsed.data);
  if (!split.ok) {
    return NextResponse.json({ error: split.error }, { status: 400 });
  }
  const { payload, background } = split;
  try {
    const token = createExportToken(payload);
    const renderUrl = buildRenderUrl(getPublicOrigin(request), payload.templateId, token);
    if (renderUrl.length > MAX_RENDER_URL_LENGTH) {
      return NextResponse.json(
        { error: "Banner settings are too long to export. Shorten the text or image link." },
        { status: 413 },
      );
    }
    const pngBuffer = await captureBannerPng({
      url: renderUrl,
      size: payload.size,
      pixelRatio: payload.pixelRatio ?? 3,
      background,
    });
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=\"${payload.templateId}.png\"`,
      },
    });
  } catch (error) {
    console.error("Export failed", error);
    return NextResponse.json({ error: "Unable to export banner" }, { status: 500 });
  }
}
