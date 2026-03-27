"use client";

import { TemplateId } from "@/src/types/template";
import { ContributionBannerRenderer } from "@/src/templates/contribution-banner/Renderer";
import { GithubBannerRenderer } from "@/src/templates/github-banner/Renderer";
import { ReposBannerRenderer } from "@/src/templates/repos-banner/Renderer";
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

  if (templateId === "repos-banner") {
    return <ReposBannerRenderer state={state} data={data} isExport={isExport} />;
  }

  if (templateId === "contribution-banner") {
    return <ContributionBannerRenderer state={state} data={data} isExport={isExport} />;
  }

  return <QuoteBannerRenderer state={state} data={data} isExport={isExport} />;
}
