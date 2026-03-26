import { NextRequest, NextResponse } from "next/server";
import { getContributions } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  const rawYear = request.nextUrl.searchParams.get("year");
  const currentYear = String(new Date().getFullYear());
  const year = rawYear && rawYear !== "latest" && rawYear !== currentYear ? rawYear : undefined;
  try {
    const contributions = await getContributions(username, year);
    return NextResponse.json(contributions);
  } catch {
    return NextResponse.json({ error: "Unable to fetch contribution data" }, { status: 502 });
  }
}
