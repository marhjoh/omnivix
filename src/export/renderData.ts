import "server-only";
import { Effect } from "effect";
import { GITHUB_LOADERS } from "@/src/github/client";
import { usernameOf } from "@/src/lib/githubUsername";
import { reposForBanner, selectedReposOf } from "@/src/lib/repoSelection";
import { contributionYear } from "@/src/lib/contributionYear";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";

/**
 * The GitHub data the render page draws: only what this banner needs, loaded in parallel. The
 * export has already checked the settings, so the username and year are valid.
 */
export function loadRenderData(templateId: TemplateId, state: Record<string, unknown>) {
  const username = usernameOf(state);
  const needs = new Set(templateRegistry[templateId].meta.githubData);
  const none = Effect.succeed(undefined);
  return Effect.all(
    {
      user: needs.has("user") ? GITHUB_LOADERS.user(username) : none,
      contributions: needs.has("contributions")
        ? GITHUB_LOADERS.contributions(username, contributionYear(state.year))
        : none,
      repos: needs.has("repos")
        ? GITHUB_LOADERS.repos(username).pipe(
            Effect.map((lists) => reposForBanner(lists, state.mode, selectedReposOf(state))),
          )
        : none,
    },
    { concurrency: "unbounded" },
  );
}
