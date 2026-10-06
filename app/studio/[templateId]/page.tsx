import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { parseSidebarCollapsedCookie, SIDEBAR_COOKIE_NAME } from "@/src/studio/sidebarCookie";
import { TemplateId } from "@/src/types/template";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  if (!(templateId in templateRegistry)) {
    notFound();
  }
  const cookieStore = await cookies();
  const sidebarCollapsed = parseSidebarCollapsedCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);
  return (
    <StudioShell
      key={templateId}
      templateId={templateId as TemplateId}
      initialSidebarCollapsed={sidebarCollapsed}
    />
  );
}
