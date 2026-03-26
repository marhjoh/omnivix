import { ContributionsNormalized, GithubUserNormalized, RepoNormalized } from "@/src/github/normalize";

export interface RenderData {
  user?: GithubUserNormalized;
  contributions?: ContributionsNormalized;
  repos?: RepoNormalized[];
}
