import { getTemplates } from "@/src/templates/registry";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingFooter } from "@/src/landing/LandingFooter";
import type { Metadata } from "next";
import type { TemplateMeta } from "@/src/types/template";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const templates: TemplateMeta[] = getTemplates().map((t) => t.meta);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingShowcase templates={templates} />
      </main>
      <LandingFooter />
    </div>
  );
}
