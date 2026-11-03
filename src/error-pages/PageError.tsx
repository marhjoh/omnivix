"use client";

import { ERROR_PAGE_TITLE } from "@/src/lib/site";
import { SiteShell } from "@/src/landing/SiteShell";
import { RuntimeError, type RuntimeErrorProps } from "@/src/error-pages/RuntimeError";

/** The page app/error.tsx shows, loaded only when a page breaks. */
export default function PageError(props: RuntimeErrorProps) {
  return (
    <SiteShell>
      <title>{ERROR_PAGE_TITLE}</title>
      <RuntimeError {...props} />
    </SiteShell>
  );
}
