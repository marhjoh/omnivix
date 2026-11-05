import type { Metadata } from "next";
import Link from "next/link";
import { getTemplates } from "@/src/templates/registry";
import { studioPath } from "@/src/lib/site";
import { ErrorScreen } from "@/src/error-pages/ErrorScreen";
import { LazySiteShell } from "@/src/landing/LazySiteShell";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Unknown URLs and notFound(). The status is only 404 if notFound() runs before streaming starts.
 * The export relies on that status.
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
            <Link href={studioPath(getTemplates()[0].meta.id)} className="btn-secondary">
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
