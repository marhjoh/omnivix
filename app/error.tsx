"use client";

import { SITE_NAME } from "@/src/lib/site";
import { SiteShell } from "@/src/landing/SiteShell";
import { RuntimeError } from "@/src/error-pages/RuntimeError";

/** Errors in a page. Errors in the root layout go to global-error.tsx. */
export default function ErrorPage(props: {
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
