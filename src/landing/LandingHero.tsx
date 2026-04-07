"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeroMaskedStrips } from "@/src/landing/HeroMaskedStrips";
import landingStyles from "@/src/landing/landing.module.css";
import type { TemplateId } from "@/src/types/template";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LandingHero({ titleById = {} }: { titleById?: Partial<Record<TemplateId, string>> }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="bg-bg px-4 py-20 sm:py-28 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="relative min-h-[440px] overflow-hidden sm:min-h-[520px] md:min-h-[600px]">
          <div className="absolute inset-0 z-0">
            <HeroMaskedStrips variant="underlay" titleById={titleById} />
          </div>

          <div className={landingStyles.heroMesh} aria-hidden />
          <div className={landingStyles.heroAtmosphere} aria-hidden />
          <div className={landingStyles.heroScrim} aria-hidden />
          <div className={landingStyles.heroStripVignette} aria-hidden />

          <div className="relative z-10 flex flex-col items-center px-4 pb-16 pt-14 text-center sm:px-10 sm:pb-20 sm:pt-16 md:pb-24 md:pt-20">
            <motion.div
              className={landingStyles.heroCopyFrame}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easeOut }}
            >
              <div className={landingStyles.heroCopyInner}>
                <motion.p
                  className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted sm:mb-5"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.06, ease: easeOut }}
                >
                  LinkedIn · X
                </motion.p>

                <div className={landingStyles.heroAccentBar} aria-hidden />

                <motion.h1
                  className="text-balance"
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1, ease: easeOut }}
                >
                  <span
                    className={`${landingStyles.heroWordmark} text-[2.85rem] font-bold leading-[0.98] sm:text-6xl md:text-7xl md:leading-[0.96]`}
                  >
                    Omnivix
                  </span>
                  <span
                    className={`${landingStyles.heroSubline} text-xl leading-tight sm:text-2xl md:text-3xl`}
                  >
                    a banner generator
                  </span>
                  <span className="mx-auto mt-5 block max-w-md text-pretty text-base font-medium leading-relaxed tracking-normal text-muted sm:mt-6 sm:text-lg">
                    Create profile banners you actually want to use
                  </span>
                </motion.h1>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
