import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/src/export/payload";
import { createExportToken } from "@/src/export/session-store";
import { buildRenderUrl } from "@/src/export/render-url";
import { captureBannerPng } from "@/src/export/playwright";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = exportRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid export payload" }, { status: 400 });
  }
  try {
    const token = createExportToken(parsed.data);
    const renderUrl = buildRenderUrl(request.nextUrl.origin, parsed.data.templateId, token);
    const pngBuffer = await captureBannerPng({
      url: renderUrl,
      size: parsed.data.size,
      pixelRatio: parsed.data.pixelRatio ?? 2,
    });
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename=\"${parsed.data.templateId}.png\"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to export banner" }, { status: 500 });
  }
}
