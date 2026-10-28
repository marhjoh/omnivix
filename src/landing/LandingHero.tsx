import { HeroMarquee } from "@/src/landing/HeroMarquee";
import { BANNER_PLATFORMS } from "@/src/lib/sizes";
import { SITE_NAME, SITE_TAGLINE } from "@/src/lib/site";
import { PlatformIcon } from "@/src/ui/PlatformIcon";
import landingStyles from "@/src/landing/landing.module.css";

export function LandingHero() {
  // Left-aligned like the section headings below; the name is the largest type on the page.
  return (
    <section className="overflow-x-clip bg-bg px-4 pt-16 pb-6 sm:pt-24">
      <div className="relative mx-auto max-w-6xl">
        <p className="mb-6 flex flex-wrap items-center gap-3 text-muted sm:mb-8">
          <span className="sr-only">
            For {BANNER_PLATFORMS.map((platform) => platform.name).join(", ")}
          </span>
          {BANNER_PLATFORMS.map((platform) => (
            <PlatformIcon key={platform.name} icon={platform.id} size={16} />
          ))}
        </p>
        <div className={landingStyles.heroGlow} aria-hidden />
        <h1 className="relative">
          <span className={`${landingStyles.gradientText} ${landingStyles.heroName}`}>
            {SITE_NAME}
          </span>{" "}
          <span className={`${landingStyles.heroSubline} mt-1`}>a banner generator</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted sm:mt-8">{SITE_TAGLINE}</p>
      </div>
      <div className="relative mx-auto mt-4 max-w-6xl overflow-hidden">
        <div className={landingStyles.heroScrim} aria-hidden />
        <div className={landingStyles.heroStripVignette} aria-hidden />
        <HeroMarquee />
      </div>
    </section>
  );
}
