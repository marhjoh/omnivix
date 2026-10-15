import type { NextRequest } from "next/server";
import { getRepos } from "@/src/github/client";
import { githubRoute } from "@/src/github/route";
import { parseRepoSelection } from "@/src/lib/repoSelection";

export function GET(request: NextRequest) {
  return githubRoute(request, "Couldn't load repositories from GitHub.", (username, params) =>
    getRepos(
      username,
      params.get("mode") === "selected" ? "selected" : "pinned",
      parseRepoSelection(params.get("selected")),
    ),
  );
}
