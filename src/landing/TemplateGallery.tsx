"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, GitGraph, BookMarked, Quote, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { TemplateMeta } from "@/src/types/template";

const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "github-banner": GitGraph,
  "repos-banner": BookMarked,
  "quote-banner": Quote,
  "contribution-banner": BarChart3,
};

function ContributionGrid() {
  const cells = useMemo(() => {
    return Array.from({ length: 91 }).map((_, i) => {
      const row = i % 7;
      const col = Math.floor(i / 7);
      const seed = (row * 13 + col * 17) % 100;
      const intensity =
        seed < 30 ? 0.15 : seed < 50 ? 0.3 : seed < 70 ? 0.5 : seed < 85 ? 0.7 : 0.9;
      return intensity;
    });
  }, []);

  return (
    <div className="grid grid-cols-[repeat(13,1fr)] gap-[3px]">
      {cells.map((intensity, i) => (
        <div
          key={i}
          className="h-[10px] w-[10px] rounded-[2px]"
          style={{ backgroundColor: `oklch(0.55 0.18 145 / ${intensity})` }}
        />
      ))}
    </div>
  );
}

function PinnedReposPreview() {
  const repos = [
    { name: "omnivix", lang: "TypeScript", color: "#3178c6" },
    { name: "next.js", lang: "JavaScript", color: "#f7df1e" },
    { name: "tailwind", lang: "CSS", color: "#38bdf8" },
    { name: "prisma", lang: "TypeScript", color: "#3178c6" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {repos.map((repo) => (
        <div key={repo.name} className="rounded-md border border-white/10 bg-white/5 p-2.5">
          <div className="mb-1.5 text-[11px] font-medium text-white/90">{repo.name}</div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: repo.color }} />
            <span className="text-[9px] text-white/50">{repo.lang}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuotePreview() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Quote className="mb-2 h-5 w-5 text-white/40" />
      <p className="max-w-[180px] text-[11px] italic leading-relaxed text-white/80">
        &ldquo;Build once, ship everywhere.&rdquo;
      </p>
      <span className="mt-2 text-[9px] text-white/40">&mdash; Omnivix</span>
    </div>
  );
}

function ContributionStatsPreview() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
        <div className="space-y-1">
          <div className="h-2.5 w-16 rounded bg-white/30" />
          <div className="h-2 w-12 rounded bg-white/15" />
        </div>
      </div>
      <ContributionGrid />
      <div className="text-[10px] text-white/50">@marhjoh</div>
    </div>
  );
}

const templatePreviews: Record<string, React.ReactNode> = {
  "github-banner": <ContributionStatsPreview />,
  "repos-banner": <PinnedReposPreview />,
  "quote-banner": <QuotePreview />,
  "contribution-banner": <ContributionStatsPreview />,
};

interface Props {
  templates: TemplateMeta[];
}

export function TemplateGallery({ templates }: Props) {
  return (
    <section id="templates" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
            Templates
          </span>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your template
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            Select a template, customize the design, and download your banner in seconds.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template, i) => {
            const Icon = templateIcons[template.id] ?? GitGraph;
            const preview = templatePreviews[template.id];

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href={`/studio/${template.id}`} className="group block">
                  <div className="omnivix-card overflow-hidden">
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#0d1117] p-6">
                      <div className="flex h-full items-center justify-center">{preview}</div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                        <span className="btn-primary gap-2 text-sm">
                          Create
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="rounded-md bg-surface-2 p-1.5">
                          <Icon className="h-3.5 w-3.5 text-text" />
                        </div>
                        <h3 className="text-sm font-semibold">{template.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed text-muted">{template.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
