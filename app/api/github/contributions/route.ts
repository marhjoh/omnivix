import { NextRequest, NextResponse } from "next/server";
import { githubErrorResponse } from "@/src/github/errorResponse";
import { getContributions } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  const rawYear = request.nextUrl.searchParams.get("year");
  const year = rawYear && rawYear.length > 0 ? rawYear : "latest";
  try {
    const contributions = await getContributions(username, year);
    return NextResponse.json(contributions);
  } catch (error) {
    return githubErrorResponse(error, username, "Unable to fetch contribution data");
  }
}
