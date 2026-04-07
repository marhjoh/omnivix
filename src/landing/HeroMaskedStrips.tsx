"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { TemplateId } from "@/src/types/template";
import { HERO_STRIP_TEMPLATE_IDS, landingPreviewSrc } from "@/src/landing/landingPreviewAssets";

/** Vertical focus within each wide export so strips feel distinct. */
const STRIP_FOCUS: Record<TemplateId, string> = {
  "github-banner": "center 38%",
  "repos-banner": "center 52%",
  "quote-banner": "center 48%",
  "contribution-banner": "center 45%",
};

const STRIP_INSET: string[] = [
  "md:translate-x-0",
  "md:translate-x-[3%]",
  "md:-translate-x-[1.5%]",
  "md:translate-x-[2%]",
];

type Variant = "default" | "underlay";

const stripHeight = {
  default: "h-[48px] sm:h-[56px] md:h-[64px]",
  underlay: "h-[52px] sm:h-[58px] md:h-[68px]",
};

export function HeroMaskedStrips({
  variant = "default",
  titleById = {},
}: {
  variant?: Variant;
  titleById?: Partial<Record<TemplateId, string>>;
}) {
  const reduceMotion = useReducedMotion();
  const isUnderlay = variant === "underlay";

  return (
    <div
      className={
        isUnderlay
          ? "flex h-full w-full flex-col justify-end gap-2 px-3 pb-6 pt-20 sm:gap-2.5 sm:px-5 sm:pb-8 sm:pt-24 md:pt-28"
          : "mx-auto mt-16 max-w-4xl space-y-2.5 px-1 sm:mt-20 sm:space-y-3"
      }
    >
      {HERO_STRIP_TEMPLATE_IDS.map((templateId, i) => {
        const title = titleById[templateId];
        const src = landingPreviewSrc(templateId);
        const inset = isUnderlay ? "" : (STRIP_INSET[i] ?? "");

        return (
          <motion.div
            key={templateId}
            className={`relative ${inset}`}
            initial={reduceMotion ? false : { opacity: 0, x: isUnderlay ? 0 : -16 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`relative w-full overflow-hidden rounded-lg ring-1 ring-border/40 md:rounded-xl ${stripHeight[variant]}`}
              style={{
                maskImage:
                  "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
              }}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={i === 0}
                loading={i < 2 ? "eager" : "lazy"}
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
                style={{ objectPosition: STRIP_FOCUS[templateId] }}
              />
            </div>
            <span className="sr-only">{title ?? templateId} — preview strip</span>
          </motion.div>
        );
      })}
    </div>
  );
}
