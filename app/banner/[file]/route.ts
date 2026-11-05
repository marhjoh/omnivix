import type { NextRequest } from "next/server";
import { bannerImageRoute } from "@/src/export/bannerImageRoute";

export async function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  return bannerImageRoute(request, (await params).file);
}
