import { notFound } from "next/navigation";
import { templateRegistry } from "@/src/templates/registry";
import { TemplateId } from "@/src/types/template";
import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerRenderer } from "@/src/templates/BannerRenderer";
import { consumeExportToken } from "@/src/export/session-store";
import { getContributions, getRepos, getUserSummary } from "@/src/github/client";

export default async function RenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { templateId } = await params;
  const { token } = await searchParams;
  if (!(templateId in templateRegistry) || !token) notFound();

  const payload = consumeExportToken(token);
  if (!payload || payload.templateId !== templateId) notFound();

  const size = BANNER_SIZES[payload.size];
  const username = payload.state.username;
  const rawYear =
    typeof payload.state.year === "string" && payload.state.year.length > 0
      ? payload.state.year
      : String(new Date().getFullYear());
  const user = typeof username === "string" && username ? await getUserSummary(username) : undefined;
  const contributions =
    typeof username === "string" && username ? await getContributions(username, rawYear) : undefined;
  const repos =
    templateId === "repos-banner" && typeof username === "string" && username
      ? await getRepos(
          username,
          payload.state.mode === "selected" ? "selected" : "pinned",
          String(payload.state.selectedRepos ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        )
      : undefined;

  return (
    <main
      style={{
        width: size.width,
        height: size.height,
        overflow: "hidden",
      }}
    >
      <BannerRenderer
        templateId={templateId as TemplateId}
        state={payload.state}
        data={{ user, contributions, repos }}
        isExport
        uiTheme={payload.uiTheme ?? "dark"}
      />
    </main>
  );
}
