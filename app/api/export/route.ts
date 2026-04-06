import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/src/export/payload";
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
  try {
    const token = createExportToken(parsed.data);
    const renderUrl = buildRenderUrl(getPublicOrigin(request), parsed.data.templateId, token);
    if (renderUrl.length > MAX_RENDER_URL_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Export payload is too large for a render URL. Remove or shrink a large background image and try again.",
        },
        { status: 413 },
      );
    }
    const pngBuffer = await captureBannerPng({
      url: renderUrl,
      size: parsed.data.size,
      pixelRatio: parsed.data.pixelRatio ?? 3,
    });
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=\"${parsed.data.templateId}.png\"`,
      },
    });
  } catch (error) {
    console.error("Export failed", error);
    return NextResponse.json({ error: "Unable to export banner" }, { status: 500 });
  }
}
