"use client";

import { SITE_NAME } from "@/src/lib/site";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingFooter } from "@/src/landing/LandingFooter";
import { RuntimeError } from "@/src/landing/RuntimeError";

/** An error while rendering a page. The root layout still renders; global-error.tsx covers it. */
export default function ErrorPage(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <title>{`Something broke · ${SITE_NAME}`}</title>
      <LandingHeader />
      <RuntimeError {...props} />
      <LandingFooter />
    </div>
  );
}
