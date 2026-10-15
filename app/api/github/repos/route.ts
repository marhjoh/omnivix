import { NextRequest, NextResponse } from "next/server";
import { githubErrorResponse } from "@/src/github/errorResponse";
import { getRepos } from "@/src/github/client";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const mode = request.nextUrl.searchParams.get("mode") === "selected" ? "selected" : "pinned";
  const selected = (request.nextUrl.searchParams.get("selected") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }
  try {
    const repos = await getRepos(username, mode, selected);
    return NextResponse.json(repos);
  } catch (error) {
    return githubErrorResponse(error, username, "Unable to fetch repo data");
  }
}
