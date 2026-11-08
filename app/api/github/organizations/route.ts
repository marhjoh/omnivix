import type { NextRequest } from "next/server";
import { TTL_SHORT } from "@/src/github/cacheTimes";
import { getOrganizations } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  return githubRoute(request, {
    failure: "Couldn't load organizations from GitHub.",
    ttlMs: TTL_SHORT,
    load: getOrganizations,
  });
}
