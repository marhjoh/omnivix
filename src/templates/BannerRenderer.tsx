"use client";

import type { ComponentType } from "react";
import type { Theme } from "@/src/theme/theme";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Frame } from "@/src/banner/Frame";
import { backgroundFromState } from "@/src/banner/background";
import { logoFromState } from "@/src/banner/logo";
import { ContributionBannerRenderer } from "@/src/templates/contribution-banner/Renderer";
import { GithubBannerRenderer } from "@/src/templates/github-banner/Renderer";
import { ReposBannerRenderer } from "@/src/templates/repos-banner/Renderer";
import { QuoteBannerRenderer } from "@/src/templates/quote-banner/Renderer";
import type { RenderData, RendererProps, TemplateId } from "@/src/templates/types";

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
  transparent = false,
}: {
  templateId: TemplateId;
  state: Record<string, unknown>;
  data: RenderData;
  /** Overrides the app's theme. The export's render page sets it. */
  uiTheme?: Theme;
  /** Leaves out the theme's background color. */
  transparent?: boolean;
}) {
  const { theme } = useTheme();
  const shownTheme = uiTheme ?? theme;
  const Renderer = RENDERERS[templateId];
  return (
    <Frame
      uiTheme={shownTheme}
      transparent={transparent}
      background={backgroundFromState(state)}
      logo={logoFromState(state)}
    >
      <Renderer state={state} data={data} uiTheme={shownTheme} />
    </Frame>
  );
}
