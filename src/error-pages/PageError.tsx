"use client";

import { SiteShell } from "@/src/landing/SiteShell";
import { RuntimeError, type RuntimeErrorProps } from "@/src/error-pages/RuntimeError";

/** The page app/error.tsx shows, loaded only when a page breaks. */
export default function PageError(props: RuntimeErrorProps) {
  return (
    <SiteShell>
      <RuntimeError {...props} />
    </SiteShell>
  );
}
