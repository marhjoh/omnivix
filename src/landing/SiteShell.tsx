import type { ReactNode } from "react";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingFooter } from "@/src/landing/LandingFooter";

/** Header and footer around a page; the footer stays at the bottom of short pages. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      {children}
      <LandingFooter />
    </div>
  );
}
