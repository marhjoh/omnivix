import { NextRequest, NextResponse } from "next/server";
import { getUserSummary } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  try {
    const user = await getUserSummary(username);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Unable to fetch user data" }, { status: 502 });
  }
}
