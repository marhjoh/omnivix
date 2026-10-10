import type { Metadata } from "next";
import { getTemplates } from "@/src/templates/registry";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingHowItWorks } from "@/src/landing/LandingHowItWorks";
import { LandingFaq } from "@/src/landing/LandingFaq";
import { LandingFooter } from "@/src/landing/LandingFooter";
import { landingJsonLd } from "@/src/landing/structuredData";
import type { TemplateMeta } from "@/src/types/template";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const templates: TemplateMeta[] = getTemplates().map((t) => t.meta);

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
        <LandingShowcase templates={templates} />
        <LandingHowItWorks />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
