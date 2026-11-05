import type { NextRequest } from "next/server";
import { TTL_SHORT } from "@/src/github/cacheTimes";
import { getRepoLists } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

/** Pinned and owned public repos together. The studio picks from them. */
export function GET(request: NextRequest) {
  return githubRoute(request, {
    failure: "Couldn't load repositories from GitHub.",
    ttlMs: TTL_SHORT,
    load: getRepoLists,
  });
}
