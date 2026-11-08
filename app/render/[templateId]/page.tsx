import "server-only";
import { notFound } from "next/navigation";
import { isTemplateId } from "@/src/templates/registry";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { DEFAULT_THEME } from "@/src/theme/theme";
import { verifyExportToken } from "@/src/export/exportToken";
import { Effect, Result } from "effect";
import { loadRenderData } from "@/src/export/renderData";
import type { GithubError } from "@/src/github/errors";
import type { FeedUnreadable } from "@/src/feeds/errors";
import { GITHUB_LIMIT_ATTRIBUTE, GITHUB_USER_MISSING_ATTRIBUTE } from "@/src/export/renderProblem";
import type { RenderData } from "@/src/templates/types";

/**
 * Without data there's no banner. The marker tells the export why (see renderProblem.ts). The export
 * checks the feed before it opens this page, so a feed that fails here fails the render.
 */
function problemMarker(error: GithubError | FeedUnreadable) {
  switch (error._tag) {
    case "GithubRateLimited":
      return <main {...{ [GITHUB_LIMIT_ATTRIBUTE]: error.resetAt.toISOString() }} />;
    case "GithubUserNotFound":
      return <main {...{ [GITHUB_USER_MISSING_ATTRIBUTE]: "" }} />;
    case "GithubRequestFailed":
    case "FeedUnreadable":
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
        transparent={payload.transparent === true}
      />
    </main>
  );
}
