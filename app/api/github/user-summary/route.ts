import type { NextRequest } from "next/server";
import { getUserSummary, TTL_SHORT } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  return githubRoute(request, {
    failure: "Couldn't load the GitHub profile.",
    ttlMs: TTL_SHORT,
    load: getUserSummary,
  });
}
