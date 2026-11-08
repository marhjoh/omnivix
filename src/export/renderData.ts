import "server-only";
import { Effect } from "effect";
import {
  getContributions,
  getOrganizations,
  getRepoLists,
  getUserSummary,
} from "@/src/github/client";
import { techIcons } from "@/src/icons/simpleIcons";
import { parseIconSelection } from "@/src/icons/iconSelection";
import { drawnIcons } from "@/src/icons/bannerIcons";
import { usernameOf } from "@/src/lib/githubUsername";
import { reposForBanner } from "@/src/lib/repoSelection";
import { yearOf } from "@/src/lib/contributionYear";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, TemplateId } from "@/src/templates/types";

/**
 * Loads the data the render page draws, only what this banner needs: GitHub data, and the Simple
 * Icons of the tech stack, intro and certifications banners. The export has already checked the
 * settings, so the username and year are valid.
 */
export function loadRenderData(templateId: TemplateId, state: BannerSettings) {
  const username = usernameOf(state);
  const needs = new Set(templateRegistry[templateId].meta.githubData);
  const none = Effect.succeed(undefined);
  return Effect.all(
    {
      user: needs.has("user") ? getUserSummary(username) : none,
      contributions: needs.has("contributions") ? getContributions(username, yearOf(state)) : none,
      repos: needs.has("repos")
        ? getRepoLists(username).pipe(
            Effect.map((lists) =>
              reposForBanner(
                lists,
                "mode" in state ? state.mode : undefined,
                "selectedRepos" in state ? state.selectedRepos : "",
              ),
            ),
          )
        : none,
      organizations: needs.has("organizations") ? getOrganizations(username) : none,
      icons: Effect.succeed(techIcons(parseIconSelection(drawnIcons(state)))),
    },
    { concurrency: "unbounded" },
  );
}
