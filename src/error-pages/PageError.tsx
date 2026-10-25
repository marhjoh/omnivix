"use client";

import { SITE_NAME } from "@/src/lib/site";
import { SiteShell } from "@/src/landing/SiteShell";
import { RuntimeError } from "@/src/error-pages/RuntimeError";

/** The page app/error.tsx shows, loaded only when a page breaks. */
export default function PageError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <SiteShell>
      <title>{`Something broke · ${SITE_NAME}`}</title>
      <RuntimeError {...props} />
    </SiteShell>
  );
}
