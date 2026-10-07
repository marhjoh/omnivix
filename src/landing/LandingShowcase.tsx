"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { TemplateId, TemplateMeta } from "@/src/types/template";
import { landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import landingStyles from "@/src/landing/landing.module.css";

function metaById(templates: TemplateMeta[]): Partial<Record<TemplateId, TemplateMeta>> {
  return Object.fromEntries(templates.map((m) => [m.id, m])) as Partial<Record<TemplateId, TemplateMeta>>;
}

const SHOWCASE_ORDER: TemplateId[] = [
  "github-banner",
  "repos-banner",
  "quote-banner",
  "contribution-banner",
];

function ShowcaseCard({
  templateId,
  title,
}: {
  templateId: TemplateId;
  title: string;
}) {
  const src = landingPreviewSrc(templateId);

  // No fade-in: cards are visible in the server HTML, so the grid never looks empty while JS loads.
  return (
    <Link
      href={`/studio/${templateId}`}
      className={`group block h-full min-w-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${landingStyles.showcaseTile}`}
    >
      <div className={landingStyles.showcasePreview}>
        <Image
          src={src}
          // Decorative: the caption names the link.
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          loading="lazy"
          className="object-cover object-center transition-transform duration-500 ease-out motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-hover:scale-[1.02]"
        />
      </div>
      <p className={`px-4 py-3.5 text-sm font-semibold tracking-tight text-text ${landingStyles.showcaseCaption}`}>
        {title}
      </p>
    </Link>
  );
}

export function LandingShowcase({ templates }: { templates: TemplateMeta[] }) {
  const byId = useMemo(() => metaById(templates), [templates]);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="scroll-mt-[5.5rem] bg-bg px-4 pb-20 pt-6 sm:pb-24 sm:pt-10 md:scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center md:mb-12">
          <h2
            id="showcase-heading"
            className="text-2xl font-semibold tracking-tight text-text sm:text-3xl"
          >
            Templates
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {SHOWCASE_ORDER.map((templateId) => (
            <ShowcaseCard
              key={templateId}
              templateId={templateId}
              title={byId[templateId]?.title ?? templateId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
