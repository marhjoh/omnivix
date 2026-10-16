import type { TemplateId } from "@/src/types/template";

/** The order templates appear in on the landing page (hero wall and Templates grid). */
export const LANDING_TEMPLATE_ORDER: readonly TemplateId[] = [
  "github-banner",
  "repos-banner",
  "quote-banner",
  "contribution-banner",
];

/** Public URL for the template's preview image: an exported banner as WebP at 2× (3168px wide). */
export function landingPreviewSrc(templateId: TemplateId): string {
  return `/landing/${templateId}.webp`;
}
