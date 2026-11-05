"use client";

import type { ReactNode } from "react";
import { environmentManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data younger than this is used as is: returning to the studio, or to a year or user
        // shown before, renders it at once without asking GitHub again. Unused data is dropped
        // after gcTime (5 minutes by default).
        staleTime: 60_000,
        // Retrying is the user's choice (the preview's Retry button): a GitHub error or one of
        // our 429s would only fail again.
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Fetch even when the browser says it's offline, so a lost connection shows as an error
        // with Retry instead of a preview that keeps loading.
        networkMode: "always",
      },
    },
  });
}

/** One for the browser session, so the data survives moving between templates. */
const browserQueryClient = environmentManager.isServer() ? undefined : makeQueryClient();

/** The studio's query cache. A server render gets its own, so requests never share one. */
export function StudioQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={browserQueryClient ?? makeQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
