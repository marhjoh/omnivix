import { useEffect, useRef, useState } from "react";
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

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const { message, limit } = await readApiError(res);
    // Without a message of ours, the caller's fallback is used.
    throw new FetchError(message ?? "", res.status, limit);
  }
  return res.json() as Promise<T>;
}

type FetchResult<T> = {
  url: string;
  nonce: number;
  data?: T;
  error: string | null;
  /** HTTP status of the failed request; 404 means the GitHub user doesn't exist. */
  status: number | null;
  limit: ApiLimit | null;
};

/**
 * Last successful response per url, kept for the browser session. Returning to the studio, or to a
 * year or user shown before, renders that data at once; it's fetched again only when older than
 * FRESH_FOR_MS, so going back and forth doesn't ask GitHub again each time.
 */
const lastFetched = new Map<string, { data: unknown; at: number }>();

const FRESH_FOR_MS = 60_000;

/** Last successful response per `keepKey` (see useFetchJson), for urls that differ only in detail. */
const lastFetchedByKey = new Map<string, unknown>();

/**
 * Results are stored with the url/nonce they belong to and derived on read,
 * so nothing has to be reset synchronously when the url changes.
 * On error, the last data for the same url is kept (from `lastFetched`).
 */
export function useFetchJson<T>(
  url: string | null,
  nonce: number,
  fallbackError: string,
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
  const [result, setResult] = useState<FetchResult<T> | null>(null);
  const lastNonceRef = useRef(nonce);

  useEffect(() => {
    if (!url) return;
    if (initial !== undefined && !lastFetched.has(url)) {
      lastFetched.set(url, { data: initial, at: Date.now() });
    }
    // A retry always asks again; otherwise a recent response is used as is.
    const retry = lastNonceRef.current !== nonce;
    lastNonceRef.current = nonce;
    const cachedEntry = lastFetched.get(url);
    const fresh = !retry && cachedEntry !== undefined && Date.now() - cachedEntry.at < FRESH_FOR_MS;
    const ac = new AbortController();
    (fresh ? Promise.resolve(cachedEntry.data as T) : fetchJson<T>(url, ac.signal)).then(
      (data) => {
        if (ac.signal.aborted) return;
        if (!fresh) lastFetched.set(url, { data, at: Date.now() });
        if (keepKey) lastFetchedByKey.set(keepKey, data);
        setResult({ url, nonce, data, error: null, status: null, limit: null });
      },
      (error) => {
        if (ac.signal.aborted) return;
        // Only our API's own messages are shown; network errors ("Failed to fetch") use the fallback.
        const message =
          error instanceof FetchError && error.message ? error.message : fallbackError;
        setResult({
          url,
          nonce,
          error: message,
          status: error instanceof FetchError ? error.status : null,
          limit: error instanceof FetchError ? error.limit : null,
        });
      },
    );
    return () => ac.abort();
  }, [url, nonce, fallbackError, keepKey, initial]);

  const current = url && result?.url === url ? result : null;
  const settled = current !== null && current.nonce === nonce;
  const ownData =
    current?.data ?? (url ? ((lastFetched.get(url)?.data as T | undefined) ?? initial) : undefined);
  const keptData =
    url && keepKey && ownData === undefined
      ? (lastFetchedByKey.get(keepKey) as T | undefined)
      : undefined;
  return {
    data: ownData ?? keptData,
    /** The data is from another request with the same `keepKey`, shown while this one loads. */
    stale: keptData !== undefined,
    error: settled ? current.error : null,
    notFound: settled && current.status === 404,
    limit: settled ? current.limit : null,
    loading: url !== null && !settled,
  };
}

/** `url`'s data from the server render, if it has it. */
export function initialData<T>(initialGithubData: Record<string, unknown>, url: string | null) {
  return url ? (initialGithubData[url] as T | undefined) : undefined;
}
