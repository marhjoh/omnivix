"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Coffee, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SITE_LINKS } from "@/src/lib/site-links";

function ContributionGridPreview() {
  const COLS = 53;
  const ROWS = 7;
  const cells = useMemo(() => {
    return Array.from({ length: COLS * ROWS }).map((_, i) => {
      const col = Math.floor(i / ROWS);
      const row = i % ROWS;
      const seed = (row * 13 + col * 17 + row * col * 3) % 100;
      const opacity =
        seed < 30 ? 0.08 : seed < 50 ? 0.25 : seed < 70 ? 0.45 : seed < 85 ? 0.65 : 0.9;
      return { col, row, opacity };
    });
  }, []);

  return (
    <div
      className="gap-0.5"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {cells.map(({ col, row, opacity }, i) => (
        <div
          key={i}
          className="aspect-square rounded-[1px]"
          style={{
            gridColumn: col + 1,
            gridRow: row + 1,
            backgroundColor: `rgba(34, 197, 94, ${opacity})`,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-bg to-surface/30" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(45,55,69,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,55,69,0.4)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/50 px-4 py-2 text-sm backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-muted">Free and open source</span>
        </div>

        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Create stunning banners
          <br />
          <span className="text-muted">for your GitHub profile</span>
        </h1>

        <p className="mx-auto mb-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl">
          Generate beautiful LinkedIn banners, Twitter headers, and README images showcasing your
          GitHub contributions, pinned repos, and custom quotes.
        </p>

        <p className="mb-8 text-center text-sm text-muted">
          Maintained by{" "}
          <a
            href={SITE_LINKS.maintainerProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-text/90 underline-offset-2 transition-colors hover:text-text hover:underline"
          >
            @marhjoh
          </a>
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="#templates" className="btn-primary h-12 gap-2 px-8 text-base">
            Start Creating
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={SITE_LINKS.buyMeACoffee}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary h-12 gap-2 px-8 text-base"          >
            <Coffee className="h-4 w-4" aria-hidden />
            Support
          </a>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto mt-20 max-w-5xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      >
        <div className="rounded-xl border border-border/60 bg-surface/30 p-2 backdrop-blur-sm">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-muted/30" />
                <div className="h-3 w-3 rounded-full bg-muted/30" />
                <div className="h-3 w-3 rounded-full bg-muted/30" />
              </div>
              <div className="flex-1 text-center text-xs text-muted">
                omnivix.app/studio/github-banner
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row">
              <div className="hidden w-64 shrink-0 space-y-4 rounded-lg border border-border bg-surface-2/30 p-4 sm:block">
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-muted/20" />
                  <div className="h-9 w-full rounded-md border border-border bg-bg" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-muted/20" />
                  <div className="h-9 w-full rounded-md border border-border bg-bg" />
                </div>
                <div className="h-10 w-full rounded-md bg-accent" />
              </div>

              <div className="flex-1 rounded-lg border border-border bg-[#0d1117] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 rounded bg-white/20" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                  </div>
                </div>
                <ContributionGridPreview />
                <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                  <span>contributions</span>
                  <span>@marhjoh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
