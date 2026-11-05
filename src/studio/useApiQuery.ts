import { skipToken, useQuery } from "@tanstack/react-query";
import { type ApiLimit, readApiError } from "@/src/lib/apiError";

class FetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly limit: ApiLimit | null,
  ) {
    super(message);
  }
}

/** Shown when an error has no message from our API, such as a network error. */
const FALLBACK_ERROR = "Couldn't load GitHub data.";

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const { message, limit } = await readApiError(res);
    // An empty message falls back to FALLBACK_ERROR.
    throw new FetchError(message ?? "", res.status, limit);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetches JSON from one of our API routes through the studio's query cache (see
 * StudioQueryProvider). If a refresh fails, the last data stays next to the error. Switching to
 * another URL cancels the old request.
 */
export function useApiQuery<T>(
  url: string | null,
  {
    keepKey,
    initial,
  }: {
    /**
     * While a new URL loads, the last data with the same key is shown instead. For example,
     * switching the contributions year keeps the old year on screen instead of flashing "loading".
     */
    keepKey?: string;
    /** Data for this URL from the server render (see initialGithubData). */
    initial?: T;
  } = {},
) {
  const query = useQuery({
    queryKey: ["api", url],
    queryFn: url ? ({ signal }) => fetchJson<T>(url, signal) : skipToken,
    initialData: initial,
    meta: { keepKey },
    placeholderData: (previous, previousQuery) =>
      keepKey && previousQuery?.meta?.keepKey === keepKey ? previous : undefined,
  });
  // Hide the error during a refetch so a retry shows as loading right away.
  const error = query.isFetching ? null : query.error;
  const fetchError = error instanceof FetchError ? error : null;
  return {
    data: query.data,
    /** True while showing data from another URL with the same `keepKey`. */
    stale: query.isPlaceholderData,
    // Show only our API's messages. Network errors like "Failed to fetch" get the fallback.
    error: error ? fetchError?.message || FALLBACK_ERROR : null,
    notFound: fetchError?.status === 404,
    limit: fetchError?.limit ?? null,
    loading: query.isFetching,
    /** Fetches again, even if the data is fresh. */
    refetch: query.refetch,
  };
}

/** Data for `url` from the server render, if there is any. */
export function initialData<T>(initialGithubData: Record<string, unknown>, url: string | null) {
  return url ? (initialGithubData[url] as T | undefined) : undefined;
}
