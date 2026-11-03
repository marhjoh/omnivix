import type { Theme } from "@/src/theme/theme";
import {
  ContributionsNormalized,
  GithubUserNormalized,
  RepoNormalized,
} from "@/src/github/normalize";

export interface RenderData {
  user?: GithubUserNormalized;
  contributions?: ContributionsNormalized;
  repos?: RepoNormalized[];
}

/** What every template's renderer gets. It draws the content; BannerRenderer adds the frame. */
export interface RendererProps {
  state: Record<string, unknown>;
  data: RenderData;
  uiTheme: Theme;
}
