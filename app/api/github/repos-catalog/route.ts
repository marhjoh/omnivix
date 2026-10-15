import type { NextRequest } from "next/server";
import { getOwnerReposCatalog } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  return githubRoute(request, "Couldn't load repositories from GitHub.", getOwnerReposCatalog);
}
