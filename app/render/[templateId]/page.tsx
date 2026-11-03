import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { reposForBanner } from "@/src/lib/repoSelection";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { DEFAULT_THEME } from "@/src/theme/theme";
import { verifyExportToken } from "@/src/export/export-token";
import {
  getContributions,
  getRepoLists,
  getUserSummary,
  isUserNotFound,
} from "@/src/github/client";
import { GithubRateLimitError } from "@/src/github/rateLimit";
import { GITHUB_LIMIT_ATTRIBUTE, GITHUB_USER_MISSING_ATTRIBUTE } from "@/src/export/renderProblem";
import { usernameOf } from "@/src/lib/githubUsername";
import type { RenderData } from "@/src/templates/renderers/types";
import type { TemplateId } from "@/src/types/template";

/**
 * Only the data this banner draws, fetched in parallel. The export route has already checked the
 * settings against the template's schema, which fills in defaults such as the year.
 */
async function loadRenderData(
  templateId: TemplateId,
  state: Record<string, unknown>,
): Promise<RenderData> {
  const username = usernameOf(state);
  const needs = new Set(templateRegistry[templateId].meta.githubData);
  const [user, contributions, repos] = await Promise.all([
    needs.has("user") ? getUserSummary(username) : undefined,
    needs.has("contributions") ? getContributions(username, String(state.year)) : undefined,
    needs.has("repos")
      ? getRepoLists(username).then((lists) =>
          reposForBanner(lists, state.mode, String(state.selectedRepos ?? "")),
        )
      : undefined,
  ]);
  return { user, contributions, repos };
}

/** No banner without the data: a marker tells the export why (see renderProblem.ts). */
function problemMarker(error: unknown) {
  if (error instanceof GithubRateLimitError) {
    return <main {...{ [GITHUB_LIMIT_ATTRIBUTE]: error.resetAt.toISOString() }} />;
  }
  if (isUserNotFound(error)) return <main {...{ [GITHUB_USER_MISSING_ATTRIBUTE]: "" }} />;
  throw error;
}

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

  let data: RenderData;
  try {
    data = await loadRenderData(templateId, payload.state);
  } catch (error) {
    return problemMarker(error);
  }

  const { width, height } = BANNER_SIZES[payload.size];
  return (
    <main style={{ width, height, overflow: "hidden" }}>
      <BannerRenderer
        templateId={templateId}
        state={payload.state}
        data={data}
        uiTheme={payload.uiTheme ?? DEFAULT_THEME}
      />
    </main>
  );
}
