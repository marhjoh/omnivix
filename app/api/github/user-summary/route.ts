import { NextRequest, NextResponse } from "next/server";
import { githubErrorResponse } from "@/src/github/errorResponse";
import { getUserSummary } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  try {
    const user = await getUserSummary(username);
    return NextResponse.json(user);
  } catch (error) {
    return githubErrorResponse(error, username, "Unable to fetch user data");
  }
}
