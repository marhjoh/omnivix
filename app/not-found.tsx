import type { Metadata } from "next";
import Link from "next/link";
import { getTemplates } from "@/src/templates/registry";
import { ErrorScreen } from "@/src/error-pages/ErrorScreen";
import { LazySiteShell } from "@/src/landing/LazySiteShell";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Unknown URLs and notFound(). Status stays 404 (the export checks it) as long as notFound() runs
 * before streaming.
 */
export default function NotFound() {
  return (
    <LazySiteShell>
      <ErrorScreen
        code="404"
        title="Page not found."
        actions={
          <>
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <Link href={`/studio/${getTemplates()[0].meta.id}`} className="btn-secondary">
              Open the studio
            </Link>
          </>
        }
      >
        <p>The link may be wrong, or the page has moved.</p>
      </ErrorScreen>
    </LazySiteShell>
  );
}
