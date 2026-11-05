"use client";

import type { ReactNode } from "react";
import { environmentManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data younger than this is used without refetching. Going back to the studio, or to a
        // year or user seen before, renders right away. Unused data is dropped after gcTime
        // (5 minutes by default).
        staleTime: 60_000,
        // No automatic retries. A GitHub error or one of our 429s would just fail again, so the
        // user retries with the preview's Retry button.
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

/** One client per browser session, so data survives switching templates. */
const browserQueryClient = environmentManager.isServer() ? undefined : makeQueryClient();

/** The studio's query cache. Each server render gets a new one so requests never share data. */
export function StudioQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={browserQueryClient ?? makeQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
