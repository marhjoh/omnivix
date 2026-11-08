import "server-only";
import { Effect } from "effect";
import { getContributions, getRepoLists, getUserSummary } from "@/src/github/client";
import { isContributionYear, yearOf } from "@/src/lib/contributionYear";
import { githubDataUrls } from "@/src/studio/githubUrls";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, TemplateId } from "@/src/templates/types";
import { usernameOf } from "@/src/lib/githubUsername";

/**
 * How long the studio page waits for GitHub data. It's usually in the server cache and takes
 * milliseconds. If GitHub is slow, the page renders without it and the browser loads the rest.
 */
const WAIT_MS = 800;

/**
 * Loads the GitHub data the studio shows first, keyed by the URL the studio would fetch it from.
 * This way the first paint shows the banner instead of a loading screen. Anything that fails or
 * takes longer than WAIT_MS is left out, and the studio loads it as usual. A load that's still
 * running isn't canceled. It finishes into the GitHub cache, where the studio's request finds it.
 */
export async function loadInitialGithubData(
  templateId: TemplateId,
  state: BannerSettings,
): Promise<Record<string, unknown>> {
  const { meta } = templateRegistry[templateId];
  const username = usernameOf(state);
  if (!meta.needsUsername || !username) return {};
  const year = yearOf(state);
  const urls = githubDataUrls({
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
