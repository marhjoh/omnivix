import type { NextRequest } from "next/server";
import { iconsRoute } from "@/src/icons/route";

/** The icons named in `?slugs=`, with their paths, for the tech stack banner's preview. */
export function GET(request: NextRequest) {
  return iconsRoute(request);
}
