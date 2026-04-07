import { getTemplates } from "@/src/templates/registry";
import { LandingHeader } from "@/src/landing/LandingHeader";
import { LandingHero } from "@/src/landing/LandingHero";
import { LandingShowcase } from "@/src/landing/LandingShowcase";
import { LandingFooter } from "@/src/landing/LandingFooter";
import type { TemplateMeta, TemplateId } from "@/src/types/template";

export default function Home() {
  const templates: TemplateMeta[] = getTemplates().map((t) => t.meta);
  const titleById = Object.fromEntries(templates.map((m) => [m.id, m.title])) as Partial<Record<TemplateId, string>>;

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero titleById={titleById} />
        <LandingShowcase templates={templates} />
      </main>
      <LandingFooter />
    </div>
  );
}
