"use client";

import { TemplateId } from "@/src/types/template";
import { ContributionBannerRenderer } from "@/src/templates/contribution-banner/Renderer";
import { GithubBannerRenderer } from "@/src/templates/github-banner/Renderer";
import { PinnedReposBannerRenderer } from "@/src/templates/pinned-repos-banner/Renderer";
import { QuoteBannerRenderer } from "@/src/templates/quote-banner/Renderer";
import { RenderData } from "@/src/templates/renderers/types";

export function BannerRenderer({
  templateId,
  state,
  data,
  isExport = false,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  data: RenderData;
  isExport?: boolean;
}) {
  if (templateId === "github-banner") {
    return <GithubBannerRenderer state={state} data={data} isExport={isExport} />;
  }

  if (templateId === "pinned-repos-banner") {
    return <PinnedReposBannerRenderer state={state} data={data} isExport={isExport} />;
  }

  if (templateId === "contribution-banner") {
    return <ContributionBannerRenderer state={state} data={data} isExport={isExport} />;
  }

  return <QuoteBannerRenderer state={state} data={data} isExport={isExport} />;
}
