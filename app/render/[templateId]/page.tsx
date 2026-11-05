import "server-only";
import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { reposForBanner } from "@/src/lib/repoSelection";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { DEFAULT_THEME } from "@/src/theme/theme";
import { verifyExportToken } from "@/src/export/export-token";
import { Effect, Result } from "effect";
import { getContributions, getRepoLists, getUserSummary } from "@/src/github/client";
import type { GithubError } from "@/src/github/errors";
import { GITHUB_LIMIT_ATTRIBUTE, GITHUB_USER_MISSING_ATTRIBUTE } from "@/src/export/renderProblem";
import { usernameOf } from "@/src/lib/githubUsername";
import type { RenderData } from "@/src/templates/renderers/types";
import type { TemplateId } from "@/src/types/template";

/**
 * Only the data this banner draws, fetched in parallel. The export route has already checked the
 * settings against the template's schema, which fills in defaults such as the year.
 */
function loadRenderData(templateId: TemplateId, state: Record<string, unknown>) {
  const username = usernameOf(state);
  const needs = new Set(templateRegistry[templateId].meta.githubData);
  const none = Effect.succeed(undefined);
  return Effect.all(
    {
      user: needs.has("user") ? getUserSummary(username) : none,
      contributions: needs.has("contributions")
        ? getContributions(username, String(state.year))
        : none,
      repos: needs.has("repos")
        ? getRepoLists(username).pipe(
            Effect.map((lists) =>
              reposForBanner(lists, state.mode, String(state.selectedRepos ?? "")),
            ),
          )
        : none,
    },
    { concurrency: "unbounded" },
  );
}

/** No banner without the data: a marker tells the export why (see renderProblem.ts). */
function problemMarker(error: GithubError) {
  switch (error._tag) {
    case "GithubRateLimited":
      return <main {...{ [GITHUB_LIMIT_ATTRIBUTE]: error.resetAt.toISOString() }} />;
    case "GithubUserNotFound":
      return <main {...{ [GITHUB_USER_MISSING_ATTRIBUTE]: "" }} />;
    case "GithubRequestFailed":
      throw error;
  }
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

  const loaded = await Effect.runPromise(Effect.result(loadRenderData(templateId, payload.state)));
  if (Result.isFailure(loaded)) return problemMarker(loaded.failure);
  const data: RenderData = loaded.success;

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
