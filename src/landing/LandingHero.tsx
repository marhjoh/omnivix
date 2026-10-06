"use client";

import { MotionConfig, motion } from "framer-motion";
import { HeroMarquee } from "@/src/landing/HeroMarquee";
import landingStyles from "@/src/landing/landing.module.css";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  // Slide only, no fade: the copy is visible in the server HTML before JS loads.
  // reducedMotion="user" skips the slide when the OS asks for reduced motion.
  // Hero type is fluid (clamp) so it grows with the window instead of jumping at breakpoints.
  return (
    <MotionConfig reducedMotion="user">
      <section className="bg-bg px-4 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden">
            <div className={landingStyles.heroMesh} aria-hidden />
            <div className={landingStyles.heroAtmosphere} aria-hidden />
            <div className={landingStyles.heroScrim} aria-hidden />
            <div className={landingStyles.heroStripVignette} aria-hidden />

            <div className="relative z-10 flex flex-col items-center pb-6 pt-10 text-center sm:pb-8 sm:pt-16 md:pt-20">
              <motion.div
                className={landingStyles.heroCopyFrame}
                initial={{ y: 16 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.55, ease: easeOut }}
              >
                <div className={landingStyles.heroCopyInner}>
                  <motion.p
                    className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted sm:mb-5"
                    initial={{ y: 8 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.45, delay: 0.06, ease: easeOut }}
                  >
                    LinkedIn · X
                  </motion.p>

                  <div className={landingStyles.heroAccentBar} aria-hidden />

                  <motion.h1
                    className="text-balance"
                    initial={{ y: 14 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: easeOut }}
                  >
                    <span
                      className={`${landingStyles.heroWordmark} text-[clamp(1.75rem,1.075rem+6.85vw,4.5rem)] font-bold leading-[0.97]`}
                    >
                      Omnivix
                    </span>
                    <span
                      className={`${landingStyles.heroSubline} text-[clamp(1.25rem,0.9125rem+1.92vw,1.875rem)] leading-tight`}
                    >
                      a banner generator
                    </span>
                    <span className="mx-auto mt-5 block max-w-md text-pretty text-[clamp(1rem,0.9rem+0.4vw,1.125rem)] font-medium leading-relaxed tracking-normal text-muted sm:mt-6">
                      Create profile banners you actually want to use
                    </span>
                  </motion.h1>
                </div>
              </motion.div>
            </div>

            <HeroMarquee />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
