import {
  contributionBannerDefinition,
  githubBannerDefinition,
  reposBannerDefinition,
  statsBannerDefinition,
  techStackBannerDefinition,
  introBannerDefinition,
  terminalBannerDefinition,
  aiUsageBannerDefinition,
  certificationsBannerDefinition,
  latestPostsBannerDefinition,
  quoteBannerDefinition,
} from "@/src/templates/definitions";
import type { TemplateDefinition, TemplateId } from "@/src/templates/types";
import type { TemplateSettings } from "@/src/templates/stateSchemas";

export const templateRegistry: { [K in TemplateId]: TemplateDefinition<TemplateSettings[K]> } = {
  "github-banner": githubBannerDefinition,
  "repos-banner": reposBannerDefinition,
  "stats-banner": statsBannerDefinition,
  "tech-stack-banner": techStackBannerDefinition,
  "intro-banner": introBannerDefinition,
  "terminal-banner": terminalBannerDefinition,
  "ai-usage-banner": aiUsageBannerDefinition,
  "certifications-banner": certificationsBannerDefinition,
  "latest-posts-banner": latestPostsBannerDefinition,
  "contribution-banner": contributionBannerDefinition,
  "quote-banner": quoteBannerDefinition,
};

/** Own keys only, so inherited names like "constructor" or "toString" aren't templates. */
export function isTemplateId(id: string): id is TemplateId {
  return Object.hasOwn(templateRegistry, id);
}

export function getTemplates() {
  return Object.values(templateRegistry);
}
