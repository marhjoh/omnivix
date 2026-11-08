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
import { StatsBannerRenderer } from "@/src/templates/stats-banner/Renderer";
import { TechStackBannerRenderer } from "@/src/templates/tech-stack-banner/Renderer";
import { IntroBannerRenderer } from "@/src/templates/intro-banner/Renderer";
import { TerminalBannerRenderer } from "@/src/templates/terminal-banner/Renderer";
import { AiUsageBannerRenderer } from "@/src/templates/ai-usage-banner/Renderer";
import { QuoteBannerRenderer } from "@/src/templates/quote-banner/Renderer";
import type { RenderData, RendererProps, TemplateId } from "@/src/templates/types";
import type { TemplateSettings } from "@/src/templates/stateSchemas";

const RENDERERS: { [K in TemplateId]: ComponentType<RendererProps<K>> } = {
  "github-banner": GithubBannerRenderer,
  "repos-banner": ReposBannerRenderer,
  "stats-banner": StatsBannerRenderer,
  "tech-stack-banner": TechStackBannerRenderer,
  "intro-banner": IntroBannerRenderer,
  "terminal-banner": TerminalBannerRenderer,
  "ai-usage-banner": AiUsageBannerRenderer,
  "contribution-banner": ContributionBannerRenderer,
  "quote-banner": QuoteBannerRenderer,
};

export function BannerRenderer<K extends TemplateId>({
  templateId,
  state,
  data,
  uiTheme,
  transparent = false,
}: {
  templateId: K;
  state: TemplateSettings[K];
  data: RenderData;
  /** Overrides the app's theme. The export's render page sets it. */
  uiTheme?: Theme;
  /** Leaves out the theme's background color. */
  transparent?: boolean;
}) {
  const { theme } = useTheme();
  const shownTheme = uiTheme ?? theme;
  const Renderer: ComponentType<RendererProps<K>> = RENDERERS[templateId];
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
