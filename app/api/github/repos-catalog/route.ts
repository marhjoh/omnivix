import { NextRequest, NextResponse } from "next/server";
import { githubErrorResponse } from "@/src/github/errorResponse";
import { getOwnerReposCatalog } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  try {
    const repos = await getOwnerReposCatalog(username);
    return NextResponse.json(repos);
  } catch (error) {
    return githubErrorResponse(error, username, "Unable to fetch repo data");
  }
}
