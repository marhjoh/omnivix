import type { Metadata } from "next";
import { SITE_OPEN_GRAPH } from "@/src/lib/site";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingHowItWorks } from "@/src/landing/LandingHowItWorks";
import { LandingFaq } from "@/src/landing/LandingFaq";
import { LandingFooter } from "@/src/landing/LandingFooter";
import { landingJsonLd } from "@/src/landing/structuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(landingJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingShowcase />
        <LandingHowItWorks />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
