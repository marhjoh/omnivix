import type { ReactNode } from "react";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingFooter } from "@/src/landing/LandingFooter";

/** Wraps a page in the site header and footer. The footer stays at the bottom on short pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      {children}
      <LandingFooter />
    </div>
  );
}
