import { NextResponse, type NextRequest } from "next/server";
import { getContributions, isContributionYear } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";

export function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year") || "latest";
  if (!isContributionYear(year)) {
    return NextResponse.json({ error: "That isn't a valid year." }, { status: 400 });
  }
  return githubRoute(request, "Couldn't load contributions from GitHub.", (username) =>
    getContributions(username, year),
  );
}
