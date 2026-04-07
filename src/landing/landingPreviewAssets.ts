import type { TemplateId } from "@/src/types/template";

/** Public URL for the exported marketing PNG (canonical name per template). */
export function landingPreviewSrc(templateId: TemplateId): string {
  return `/landing/${templateId}.png`;
}

/**
 * Hero “film strip”: one masked horizontal band per template (all four), so the hero reads as
 * abstract texture—not a repeat of full showcase thumbnails.
 */
export const HERO_STRIP_TEMPLATE_IDS: TemplateId[] = [
  "github-banner",
  "repos-banner",
  "quote-banner",
  "contribution-banner",
];
