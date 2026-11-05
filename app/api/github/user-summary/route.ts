import type { NextRequest } from "next/server";
import { TTL_SHORT } from "@/src/github/cacheTimes";
import { getUserSummary } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  return githubRoute(request, {
    failure: "Couldn't load the GitHub profile.",
    ttlMs: TTL_SHORT,
    load: getUserSummary,
  });
}
