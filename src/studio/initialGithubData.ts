import {
  getContributions,
  getRepoLists,
  getUserSummary,
  isContributionYear,
} from "@/src/github/client";
import { contributionYear, githubDataUrls } from "@/src/studio/githubUrls";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/types/template";

/**
 * How long the studio page waits for GitHub. Usually it's in the server's cache and takes
 * milliseconds; a slow GitHub shouldn't hold up the page, so the browser loads what's missing.
 */
const WAIT_MS = 800;

/**
 * The GitHub data the studio shows first, by the url the studio would fetch it from, so the
 * first paint already has the banner instead of a loading screen. What fails or takes longer
 * than WAIT_MS is left out (and loaded, or reported, by the studio as usual).
 */
export async function loadInitialGithubData(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { meta } = templateRegistry[templateId];
  const username = typeof state.username === "string" ? state.username : "";
  if (!meta.needsUsername || !username) return {};
  const year = contributionYear(state.year);
  const urls = githubDataUrls({
    needsUsername: true,
    githubData: meta.githubData,
    username,
    year,
  });
  const loads: [string | null, () => Promise<unknown>][] = [
    [urls.user, () => getUserSummary(username)],
    [
      urls.contributions,
      () => (isContributionYear(year) ? getContributions(username, year) : Promise.reject()),
    ],
    [urls.repos, () => getRepoLists(username)],
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
