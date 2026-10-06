import type { TemplateId } from "@/src/types/template";

/** Public URL for the template's preview image: an exported banner as WebP at 2× (3168px wide). */
export function landingPreviewSrc(templateId: TemplateId): string {
  return `/landing/${templateId}.webp`;
}
