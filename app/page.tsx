import type { Metadata } from "next";
import { SITE_OPEN_GRAPH } from "@/src/lib/site";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingHowItWorks } from "@/src/landing/LandingHowItWorks";
import { LandingFaq } from "@/src/landing/LandingFaq";
import { landingJsonLd } from "@/src/landing/structuredData";
import { SiteShell } from "@/src/landing/SiteShell";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

export default function Home() {
  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <main className="flex-1">
        <LandingHero />
        <LandingShowcase />
        <LandingHowItWorks />
        <LandingFaq />
      </main>
    </SiteShell>
  );
}
