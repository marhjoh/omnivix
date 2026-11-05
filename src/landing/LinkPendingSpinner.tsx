"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/src/ui/Spinner";

/**
 * Inside a <Link>: a spinner while the page it opens is on its way. The studio is rendered on
 * demand (with the GitHub data, see initialGithubData), so the click would otherwise seem ignored
 * on a slow connection.
 */
export function LinkPendingSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner label="Opening" className="text-muted" /> : null;
}
