import type { NextRequest } from "next/server";
import { feedRoute } from "@/src/feeds/route";

export function GET(request: NextRequest) {
  return feedRoute(request);
}
