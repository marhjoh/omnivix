import type { Metadata } from "next";
import Link from "next/link";
import { getTemplates } from "@/src/templates/registry";
import { ErrorScreen } from "@/src/landing/ErrorScreen";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingFooter } from "@/src/landing/LandingFooter";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Unknown URLs and notFound() (an unknown template in the studio or the render page). The status
 * stays 404, which the export checks for: the render page calls notFound() before streaming.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <ErrorScreen
        code={["4", "0", "4"]}
        themeId="ocean"
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
      <LandingFooter />
    </div>
  );
}
