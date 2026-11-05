import type { NextRequest } from "next/server";
import { TTL_SHORT } from "@/src/github/cacheTimes";
import { getRepoLists } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

/** Pinned and owned public repositories together; the studio picks from them itself. */
export function GET(request: NextRequest) {
  return githubRoute(request, {
    failure: "Couldn't load repositories from GitHub.",
    ttlMs: TTL_SHORT,
    load: getRepoLists,
  });
}
