"use client";

import Link from "next/link";
import { SITE_LINKS } from "@/src/lib/site-links";
import { ErrorScreen } from "@/src/landing/ErrorScreen";

/** What app/error.tsx and app/global-error.tsx show: Try again, and how to report it. */
export function RuntimeError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorScreen
      code={["E", "R", "R"]}
      themeId="alternate"
      title="Something broke."
      actions={
        <>
          <button type="button" onClick={retry} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
        </>
      }
    >
      <p>
        Try again. If it keeps happening,{" "}
        <a
          href={`${SITE_LINKS.repo}/issues/new/choose`}
          className="text-text underline underline-offset-4 hover:text-accent-hover"
        >
          open an issue on GitHub
        </a>
        .
      </p>
      {/* Only errors on the server have a digest: a hash that matches the server's log entry
          (production hides the message itself), so it says nothing to anyone without the logs. */}
      {error.digest && (
        <p className="mt-3 text-sm">
          Include error ID <span className="font-mono text-text">{error.digest}</span> in the issue.
        </p>
      )}
    </ErrorScreen>
  );
}
