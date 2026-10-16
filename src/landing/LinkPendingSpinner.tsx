"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Inside a <Link>: a spinner while the page it opens is on its way. The studio is rendered on
 * demand (with the GitHub data, see initialGithubData), so the click would otherwise seem ignored
 * on a slow connection.
 */
export function LinkPendingSpinner() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2
      className="h-4 w-4 shrink-0 animate-spin text-muted"
      role="status"
      aria-label="Opening"
    />
  ) : null;
}
