import { NextResponse, type NextRequest } from "next/server";
import { contributionsTtlMs } from "@/src/github/cacheTimes";
import { getContributions } from "@/src/github/client";
import { contributionYear, isContributionYear } from "@/src/lib/contributionYear";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  // Without a year, the same one the studio shows by default.
  const year = contributionYear(request.nextUrl.searchParams.get("year"));
  if (!isContributionYear(year)) {
    return NextResponse.json({ error: "That isn't a valid year." }, { status: 400 });
  }
  return githubRoute(request, {
    failure: "Couldn't load contributions from GitHub.",
    ttlMs: contributionsTtlMs(year),
    load: (username) => getContributions(username, year),
  });
}
