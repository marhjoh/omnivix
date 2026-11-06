import Image from "next/image";
import type { TemplateId } from "@/src/templates/types";
import { templateRegistry } from "@/src/templates/registry";
import { studioPath } from "@/src/lib/site";
import { BANNER_SIZES, aspectRatioOf } from "@/src/lib/sizes";
import { LANDING_TEMPLATE_ORDER, landingPreviewSrc } from "@/src/landing/landingPreviewAssets";
import landingStyles from "@/src/landing/landing.module.css";
import { SectionHeading } from "@/src/landing/SectionHeading";

/** One column on phones, then two in the 72rem container with 16px padding and a 24px gap. */
const IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1152px) 50vw, 548px";

function ShowcaseCard({ templateId }: { templateId: TemplateId }) {
  // No fade-in. The cards are in the server HTML, so the grid never looks empty while JS loads.
  // A plain link, so the history entry is added on the tap. next/link adds it once the studio has
  // rendered, and on iPhone Back skips entries added that late.
  return (
    <a
      href={studioPath(templateId)}
      className={`group min-w-0 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-hidden ${landingStyles.showcaseTile}`}
    >
      <div
        className={landingStyles.showcasePreview}
        style={{ aspectRatio: aspectRatioOf(BANNER_SIZES.wide) }}
      >
        <Image
          src={landingPreviewSrc(templateId)}
          // The caption below names the link.
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
    </a>
  );
}

export function LandingShowcase() {
  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="scroll-mt-[5.5rem] overflow-x-clip bg-bg px-4 pt-6 pb-20 sm:pt-10 sm:pb-28 md:scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="showcase-heading">Templates.</SectionHeading>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {LANDING_TEMPLATE_ORDER.map((templateId) => (
            <ShowcaseCard key={templateId} templateId={templateId} />
          ))}
        </div>
      </div>
    </section>
  );
}
