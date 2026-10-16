import type { CSSProperties } from "react";
import { HeroMarquee } from "@/src/landing/HeroMarquee";
import { BANNER_PLATFORMS } from "@/src/lib/sizes";
import { SITE_NAME, SITE_TAGLINE } from "@/src/lib/site";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import landingStyles from "@/src/landing/landing.module.css";

/** How far an element slides up from, and when it starts (see .heroSlide in landing.module.css). */
function slide(from: number, delaySeconds = 0, durationSeconds = 0.55): CSSProperties {
  return {
    "--slide-from": `${from}px`,
    "--slide-delay": `${delaySeconds}s`,
    "--slide-duration": `${durationSeconds}s`,
  } as CSSProperties;
}

export function LandingHero() {
  // Slide only, no fade, in CSS: the copy is in the server HTML and visible before any script
  // loads. The slide is skipped when the OS asks for reduced motion.
  // Hero type is fluid (clamp) so it grows with the window instead of jumping at breakpoints.
  return (
    <section className="bg-bg px-4 py-20 sm:py-28 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden">
          <div className={landingStyles.heroMesh} aria-hidden />
          <div className={landingStyles.heroAtmosphere} aria-hidden />
          <div className={landingStyles.heroScrim} aria-hidden />
          <div className={landingStyles.heroStripVignette} aria-hidden />

          <div className="relative z-10 flex flex-col items-center pt-10 pb-6 text-center sm:pt-16 sm:pb-8 md:pt-20">
            <div
              className={`${landingStyles.heroCopyFrame} ${landingStyles.heroSlide}`}
              style={slide(16)}
            >
              <div className={landingStyles.heroCopyInner}>
                <p
                  className={`mb-4 flex flex-wrap items-center justify-center gap-3 text-muted sm:mb-5 ${landingStyles.heroSlide}`}
                  style={slide(8, 0.06, 0.45)}
                >
                  <span className="sr-only">
                    For {BANNER_PLATFORMS.map((platform) => platform.name).join(", ")}
                  </span>
                  {BANNER_PLATFORMS.map((platform) => (
                    <PlatformIcon key={platform.name} icon={platform.icon} size={16} />
                  ))}
                </p>

                <div className={landingStyles.heroAccentBar} aria-hidden />

                <h1 className={`text-balance ${landingStyles.heroSlide}`} style={slide(14, 0.1)}>
                  <span
                    className={`${landingStyles.heroWordmark} text-[clamp(1.75rem,1.075rem+6.85vw,4.5rem)] leading-[0.97] font-bold`}
                  >
                    {SITE_NAME}
                  </span>{" "}
                  <span
                    className={`${landingStyles.heroSubline} text-[clamp(1.25rem,0.9125rem+1.92vw,1.875rem)] leading-tight`}
                  >
                    a banner generator
                  </span>{" "}
                  <span className="mx-auto mt-5 block max-w-md text-[clamp(1rem,0.9rem+0.4vw,1.125rem)] leading-relaxed font-medium tracking-normal text-pretty text-muted sm:mt-6">
                    {SITE_TAGLINE}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <HeroMarquee />
        </div>
      </div>
    </section>
  );
}
