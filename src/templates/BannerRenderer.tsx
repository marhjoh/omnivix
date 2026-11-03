"use client";

import type { ComponentType } from "react";
import type { Theme } from "@/src/theme/theme";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { TemplateId } from "@/src/types/template";
import { ContributionBannerRenderer } from "@/src/templates/contribution-banner/Renderer";
import { GithubBannerRenderer } from "@/src/templates/github-banner/Renderer";
import { ReposBannerRenderer } from "@/src/templates/repos-banner/Renderer";
import { QuoteBannerRenderer } from "@/src/templates/quote-banner/Renderer";
import type { RenderData, RendererProps } from "@/src/templates/renderers/types";

const RENDERERS: Record<TemplateId, ComponentType<RendererProps>> = {
  "github-banner": GithubBannerRenderer,
  "repos-banner": ReposBannerRenderer,
  "contribution-banner": ContributionBannerRenderer,
  "quote-banner": QuoteBannerRenderer,
};

export function BannerRenderer({
  templateId,
  state,
  data,
  uiTheme,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  data: RenderData;
  /** When set (the export's render page), overrides the app's theme. */
  uiTheme?: Theme;
}) {
  const { theme } = useTheme();
  const Renderer = RENDERERS[templateId];
  return <Renderer state={state} data={data} uiTheme={uiTheme ?? theme} />;
}
