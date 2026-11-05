"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/src/ui/Spinner";

/**
 * Goes inside a <Link> and spins while the next page loads. The studio renders on demand with the
 * GitHub data, so on a slow connection the click would otherwise seem ignored.
 */
export function LinkPendingSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner label="Opening" className="text-muted" /> : null;
}
