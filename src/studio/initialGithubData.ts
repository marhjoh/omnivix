import "server-only";
import { Effect } from "effect";
import { getContributions, getRepoLists, getUserSummary } from "@/src/github/client";
import { isContributionYear } from "@/src/lib/utcContributionRange";
import { contributionYear, githubDataUrls } from "@/src/studio/githubUrls";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";
import { usernameOf } from "@/src/lib/githubUsername";

/**
 * How long the studio page waits for GitHub. Usually it's in the server's cache and takes
 * milliseconds; a slow GitHub shouldn't hold up the page, so the browser loads what's missing.
 */
const WAIT_MS = 800;

/**
 * The GitHub data the studio shows first, by the url the studio would fetch it from, so the
 * first paint already has the banner instead of a loading screen. What fails or takes longer
 * than WAIT_MS is left out (and loaded, or reported, by the studio as usual). Each load runs on its
 * own (`Effect.runPromise`), so one still running when the wait ends isn't stopped: it finishes
 * into the GitHub cache, where the studio's own request finds it.
 */
export async function loadInitialGithubData(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { meta } = templateRegistry[templateId];
  const username = usernameOf(state);
  if (!meta.needsUsername || !username) return {};
  const year = contributionYear(state.year);
  const urls = githubDataUrls({
    needsUsername: true,
    githubData: meta.githubData,
    username,
    year,
  });
  const loads: [string | null, () => Promise<unknown>][] = [
    [urls.user, () => Effect.runPromise(getUserSummary(username))],
    [
      urls.contributions,
      () =>
        isContributionYear(year)
          ? Effect.runPromise(getContributions(username, year))
          : Promise.reject(),
    ],
    [urls.repos, () => Effect.runPromise(getRepoLists(username))],
  ];
  const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, WAIT_MS));
  const entries = await Promise.all(
    loads.flatMap(([url, load]) =>
      url
        ? [
            Promise.race([load().catch(() => undefined), timeout]).then(
              (data) => [url, data] as const,
            ),
          ]
        : [],
    ),
  );
  return Object.fromEntries(entries.filter(([, data]) => data !== undefined));
}
