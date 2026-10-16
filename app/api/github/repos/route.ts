import type { NextRequest } from "next/server";
import { getRepoLists } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

/** Pinned and owned public repositories together; the studio picks from them itself. */
export function GET(request: NextRequest) {
  return githubRoute(request, "Couldn't load repositories from GitHub.", getRepoLists);
}
