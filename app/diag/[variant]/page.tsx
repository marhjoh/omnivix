// Temporary: finds what makes pull-to-refresh jerk on the landing page in iPhone Chrome. Not for
// merging.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingHowItWorks } from "@/src/landing/LandingHowItWorks";
import { LandingFaq } from "@/src/landing/LandingFaq";
import { SiteShell } from "@/src/landing/SiteShell";
import { LazySiteShell } from "@/src/landing/LazySiteShell";
import { DIAG_VARIANTS } from "../variants";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return Object.keys(DIAG_VARIANTS).map((variant) => ({ variant }));
}

export default async function DiagPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const config = DIAG_VARIANTS[variant as keyof typeof DIAG_VARIANTS];
  if (!config) notFound();
  const Shell = "lazyShell" in config ? LazySiteShell : SiteShell;
  return (
    <Shell>
      {config.css && <style>{config.css}</style>}
      <main className="flex-1">
        {!config.hero && !config.rest && (
          <p className="px-4 py-24 text-lg text-muted">A short page with the real header.</p>
        )}
        {config.hero && <LandingHero />}
        {config.rest && (
          <>
            <LandingShowcase />
            <LandingHowItWorks />
            <LandingFaq />
          </>
        )}
      </main>
    </Shell>
  );
}
