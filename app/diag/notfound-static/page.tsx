import Link from "next/link";
import { ErrorScreen } from "@/src/error-pages/ErrorScreen";
import { LazySiteShell } from "@/src/landing/LazySiteShell";

// Temporary: the 404 page's content as a fast, pre-built 200 page.
export default function NotFoundStatic() {
  return (
    <LazySiteShell>
      <ErrorScreen code="404" title="Page not found." actions={<Link href="/diag">Back</Link>}>
        <p>The link may be wrong, or the page has moved.</p>
      </ErrorScreen>
    </LazySiteShell>
  );
}
