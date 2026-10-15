import {
  contributionBannerDefinition,
  githubBannerDefinition,
  pinnedReposDefinition,
  quoteBannerDefinition,
} from "@/src/templates/definitions";
import type { TemplateId } from "@/src/types/template";

export const templateRegistry = {
  "github-banner": githubBannerDefinition,
  "repos-banner": pinnedReposDefinition,
  "contribution-banner": contributionBannerDefinition,
  "quote-banner": quoteBannerDefinition,
} as const;

/** Own keys only, so inherited names like "constructor" or "toString" aren't templates. */
export function isTemplateId(id: string): id is TemplateId {
  return Object.hasOwn(templateRegistry, id);
}

export function getTemplates() {
  return Object.values(templateRegistry);
}
