import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/src/lib/apiResponse";
import { isIconSelection, MAX_ICONS, parseIconSelection } from "@/src/icons/iconSelection";
import { techIcons } from "@/src/icons/simpleIcons";

/** The icons only change with a deploy, so the CDN can keep them for a day. */
const CACHE_SECONDS = 86_400;

/**
 * Answers `GET /api/icons?slugs=react,git` with those icons. Unknown slugs are left out, so a
 * studio with an icon that a simple-icons update removed still shows the rest.
 */
export function iconsRoute(request: NextRequest): Response {
  const slugs = request.nextUrl.searchParams.get("slugs") ?? "";
  if (!isIconSelection(slugs)) {
    return errorResponse(`Ask for at most ${MAX_ICONS} icons, by their Simple Icons slugs.`, 400);
  }
  return NextResponse.json(techIcons(parseIconSelection(slugs)), {
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}` },
  });
}
