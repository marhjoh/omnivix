"use client";

import Link from "next/link";
import { SITE_LINKS } from "@/src/lib/site-links";
import { textLinkClass } from "@/src/ui/textLinkClass";
import { ErrorScreen } from "@/src/error-pages/ErrorScreen";

/** Shared by app/error.tsx and app/global-error.tsx. */
export function RuntimeError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorScreen
      code="ERR"
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
        <a href={SITE_LINKS.newIssue} className={textLinkClass}>
          open an issue on GitHub
        </a>
        .
      </p>
      {/* Only server errors have a digest. It matches the server log, so it's only useful in an issue. */}
      {error.digest && (
        <p className="mt-3 text-sm">
          Include error ID <span className="font-mono text-text">{error.digest}</span> in the issue.
        </p>
      )}
    </ErrorScreen>
  );
}
