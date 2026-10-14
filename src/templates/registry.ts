import {
  contributionBannerDefinition,
  githubBannerDefinition,
  pinnedReposDefinition,
  quoteBannerDefinition,
} from "@/src/templates/definitions";

export const templateRegistry = {
  "github-banner": githubBannerDefinition,
  "repos-banner": pinnedReposDefinition,
  "contribution-banner": contributionBannerDefinition,
  "quote-banner": quoteBannerDefinition,
} as const;

export function getTemplates() {
  return Object.values(templateRegistry);
}
