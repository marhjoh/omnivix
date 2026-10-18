import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { reposForBanner } from "@/src/lib/repoSelection";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { DEFAULT_THEME } from "@/src/theme/theme";
import { verifyExportToken } from "@/src/export/export-token";
import { getContributions, getRepoLists, getUserSummary } from "@/src/github/client";
import { GITHUB_LIMIT_ATTRIBUTE, GithubRateLimitError } from "@/src/github/rateLimit";

export default async function RenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { templateId } = await params;
  const { token } = await searchParams;
  if (!isTemplateId(templateId) || !token) notFound();

  const payload = verifyExportToken(token);
  if (!payload || payload.templateId !== templateId) notFound();

  const size = BANNER_SIZES[payload.size];
  const { state } = payload;
  const username = typeof state.username === "string" ? state.username : "";
  // Only the data this banner draws, fetched in parallel. The export route has already checked
  // the settings against the template's schema, which fills in defaults such as the year.
  const needs = new Set(templateRegistry[templateId].meta.githubData);
  const data = await Promise.all([
    needs.has("user") ? getUserSummary(username) : undefined,
    needs.has("contributions") ? getContributions(username, String(state.year)) : undefined,
    needs.has("repos")
      ? getRepoLists(username).then((lists) =>
          reposForBanner(lists, state.mode, String(state.selectedRepos ?? "")),
        )
      : undefined,
  ]).catch((error: unknown) => {
    if (error instanceof GithubRateLimitError) return error;
    throw error;
  });
  // No banner without the data: a marker tells the export when GitHub's limit resets.
  if (data instanceof GithubRateLimitError) {
    return <main {...{ [GITHUB_LIMIT_ATTRIBUTE]: data.resetAt.toISOString() }} />;
  }
  const [user, contributions, repos] = data;

  return (
    <main
      style={{
        width: size.width,
        height: size.height,
        overflow: "hidden",
      }}
    >
      <BannerRenderer
        templateId={templateId}
        state={state}
        data={{ user, contributions, repos }}
        uiTheme={payload.uiTheme ?? DEFAULT_THEME}
      />
    </main>
  );
}
