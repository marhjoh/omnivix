import { TemplateId } from "@/src/types/template";
import {
  contributionBannerDefinition,
  githubBannerDefinition,
  pinnedReposDefinition,
  quoteBannerDefinition,
} from "@/src/templates/definitions";

export const templateRegistry = {
  "github-banner": githubBannerDefinition,
  "pinned-repos-banner": pinnedReposDefinition,
  "contribution-banner": contributionBannerDefinition,
  "quote-banner": quoteBannerDefinition,
} as const;

export function getTemplate(templateId: TemplateId) {
  return templateRegistry[templateId];
}

export function getTemplates() {
  return Object.values(templateRegistry);
}
