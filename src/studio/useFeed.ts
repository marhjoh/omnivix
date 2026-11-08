import { useMemo } from "react";
import { feedApiUrl, type Feed } from "@/src/banner/feed";
import type { ApiLimit } from "@/src/lib/apiError";
import { LIMIT_TITLES, TRY_AGAIN_SOON, tryAgainAt } from "@/src/lib/rateLimitMessage";
import type { PreviewProblem } from "@/src/studio/preview/types";
import { initialData, useApiQuery } from "@/src/studio/useApiQuery";

/**
 * Why the feed didn't load. A feed the server can't read gets its reason and a "Change feed"
 * button. A limit or a network problem gets "Try again".
 */
function feedProblem(
  error: string | null,
  status: number | null,
  limit: ApiLimit | null,
): PreviewProblem | null {
  if (limit?.kind === "firewall") {
    return { title: LIMIT_TITLES.requests, hint: TRY_AGAIN_SOON, action: "retry" };
  }
  if (limit) {
    return {
      title: LIMIT_TITLES[limit.kind],
      hint: tryAgainAt(limit.resetAt),
      action: "retry",
      retryAt: limit.resetAt,
    };
  }
  if (!error) return null;
  if (status === 400 || status === 422) {
    // "That link isn't an RSS or Atom feed. Look for the blog's RSS link." becomes the heading
    // and the hint. A heading has no closing period.
    const [first, ...rest] = error.split(/(?<=\.)\s+/);
    return {
      title: first.replace(/\.$/, ""),
      hint: rest.join(" ") || "Check the link, or use another feed.",
      action: "change-feed",
    };
  }
  return {
    title: "Couldn't load the feed",
    hint: "Check your connection, then try again.",
    action: "retry",
  };
}

/** Loads the latest posts banner's feed, and the problem if it can't. */
export function useFeed(link: string, initialApiData: Record<string, unknown> = {}) {
  const url = feedApiUrl(link);
  const query = useApiQuery<Feed>(url, { initial: initialData<Feed>(initialApiData, url) });
  // The preview compares problems by identity, so a new object each render would loop.
  const problem = useMemo(
    () => feedProblem(query.error, query.status, query.limit),
    [query.error, query.status, query.limit],
  );

  return {
    data: problem ? undefined : query.data,
    /** True once the posts are in, or when there's no feed to load. */
    ready: url === null || (query.data !== undefined && !problem),
    problem,
    retry: () => {
      if (query.error) void query.refetch();
    },
  };
}
