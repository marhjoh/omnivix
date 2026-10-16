import Image from "next/image";
import Link from "next/link";
import type { TemplateId } from "@/src/types/template";
import { templateRegistry } from "@/src/templates/registry";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { LANDING_TEMPLATE_ORDER, landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import landingStyles from "@/src/landing/landing.module.css";

/** Two columns in the 72rem container (16px side padding, 24px gap) from the sm breakpoint. */
const IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1152px) 50vw, 548px";

function ShowcaseCard({ templateId }: { templateId: TemplateId }) {
  // No fade-in: cards are visible in the server HTML, so the grid never looks empty while JS loads.
  return (
    <Link
      href={`/studio/${templateId}`}
      className={`group min-w-0 focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-hidden ${landingStyles.showcaseTile}`}
    >
      <div
        className={landingStyles.showcasePreview}
        style={{ aspectRatio: `${BANNER_SIZES.wide.width} / ${BANNER_SIZES.wide.height}` }}
      >
        <Image
          src={landingPreviewSrc(templateId)}
          // Decorative: the caption names the link.
          alt=""
          fill
          sizes={IMAGE_SIZES}
          loading="lazy"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <p className="px-4 py-3.5 text-sm font-semibold tracking-tight text-text">
        {templateRegistry[templateId].meta.title}
      </p>
    </Link>
  );
}

export function LandingShowcase() {
  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="scroll-mt-[5.5rem] bg-bg px-4 pt-6 pb-20 sm:pt-10 sm:pb-24 md:scroll-mt-24"
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
          {LANDING_TEMPLATE_ORDER.map((templateId) => (
            <ShowcaseCard key={templateId} templateId={templateId} />
          ))}
        </div>
      </div>
    </section>
  );
}
