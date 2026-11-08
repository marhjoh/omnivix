import "server-only";
import { Effect } from "effect";
import {
  getContributions,
  getOrganizations,
  getRepoLists,
  getUserSummary,
} from "@/src/github/client";
import { isContributionYear, yearOf } from "@/src/lib/contributionYear";
import { githubDataUrls } from "@/src/studio/githubUrls";
import { templateRegistry } from "@/src/templates/registry";
import type { BannerSettings, TemplateId } from "@/src/templates/types";
import { usernameOf } from "@/src/lib/githubUsername";
import { iconsUrl, parseIconSelection } from "@/src/icons/iconSelection";
import { techIcons } from "@/src/icons/simpleIcons";
import { drawnIcons } from "@/src/icons/bannerIcons";
import { feedApiUrl } from "@/src/banner/feed";
import { getFeed } from "@/src/feeds/client";

/**
 * How long the studio page waits for GitHub data and feeds. They're usually in the server cache and
 * take milliseconds. If one is slow, the page renders without it and the browser loads the rest.
 */
const WAIT_MS = 800;

/**
 * Loads the data the studio shows first, keyed by the URL the studio would fetch it from. This way
 * the first paint shows the banner instead of a loading screen.
 */
export async function loadInitialApiData(
  templateId: TemplateId,
  state: BannerSettings,
): Promise<Record<string, unknown>> {
  const [github, feed] = await Promise.all([loadGithubData(templateId, state), loadFeed(state)]);
  return { ...github, ...feed, ...iconData(state) };
}

/** The latest posts banner's feed. Like GitHub data, it's left out if it takes too long. */
async function loadFeed(state: BannerSettings): Promise<Record<string, unknown>> {
  if (!("feed" in state)) return {};
  const url = feedApiUrl(state.feed);
  if (!url) return {};
  const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, WAIT_MS));
  const feed = await Promise.race([
    Effect.runPromise(getFeed(state.feed)).catch(() => undefined),
    timeout,
  ]);
  return feed ? { [url]: feed } : {};
}

/** The banner's Simple Icons. They're on this server, so there's no wait. */
function iconData(state: BannerSettings): Record<string, unknown> {
  const value = drawnIcons(state);
  const url = iconsUrl(value);
  return url ? { [url]: techIcons(parseIconSelection(value)) } : {};
}

/**
 * The banner's GitHub data. Anything that fails or takes longer than WAIT_MS is left out, and the
 * studio loads it as usual. A load that's still running isn't canceled. It finishes into the GitHub
 * cache, where the studio's request finds it.
 */
async function loadGithubData(
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
    [urls.organizations, () => Effect.runPromise(getOrganizations(username))],
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
