"use client";

import type { Theme } from "@/src/theme/theme";
import { useTheme } from "@/src/theme/ThemeProvider";
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
  uiTheme: uiThemeProp,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  data: RenderData;
  /** When set (e.g. PNG render route), overrides client theme. */
  uiTheme?: Theme;
}) {
  const { theme: contextTheme } = useTheme();
  const uiTheme = uiThemeProp ?? contextTheme;

  if (templateId === "github-banner") {
    return <GithubBannerRenderer state={state} data={data} uiTheme={uiTheme} />;
  }

  if (templateId === "repos-banner") {
    return <ReposBannerRenderer state={state} data={data} uiTheme={uiTheme} />;
  }

  if (templateId === "contribution-banner") {
    return <ContributionBannerRenderer state={state} data={data} uiTheme={uiTheme} />;
  }

  return <QuoteBannerRenderer state={state} data={data} uiTheme={uiTheme} />;
}
