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

/** Shown when a request fails without a message of its own (network, platform errors). */
const FALLBACK_ERROR = "Couldn't load GitHub data.";

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const { message, limit } = await readApiError(res);
    // Without a message of ours, FALLBACK_ERROR is used.
    throw new FetchError(message ?? "", res.status, limit);
  }
  return res.json() as Promise<T>;
}

/**
 * JSON from one of our API routes, through the studio's query cache (see StudioQueryProvider). A
 * failed refresh keeps the url's last data next to the error. Leaving a url cancels its request.
 */
export function useApiQuery<T>(
  url: string | null,
  {
    keepKey,
    initial,
  }: {
    /**
     * Responses with the same key stand in for each other while a new url loads, e.g. the
     * contributions for another year, so the preview keeps its content instead of flashing
     * "loading".
     */
    keepKey?: string;
    /** This url's data from the page's server render (see initialGithubData), if it has it. */
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
  // A refetch hides the error it may clear, so a retry shows as loading at once.
  const error = query.isFetching ? null : query.error;
  const fetchError = error instanceof FetchError ? error : null;
  return {
    data: query.data,
    /** The data is from another request with the same `keepKey`, shown while this one loads. */
    stale: query.isPlaceholderData,
    // Only our API's own messages are shown; network errors ("Failed to fetch") use the fallback.
    error: error ? fetchError?.message || FALLBACK_ERROR : null,
    notFound: fetchError?.status === 404,
    limit: fetchError?.limit ?? null,
    loading: query.isFetching,
    /** Asks again, even when the data is recent. */
    refetch: query.refetch,
  };
}

/** `url`'s data from the server render, if it has it. */
export function initialData<T>(initialGithubData: Record<string, unknown>, url: string | null) {
  return url ? (initialGithubData[url] as T | undefined) : undefined;
}
