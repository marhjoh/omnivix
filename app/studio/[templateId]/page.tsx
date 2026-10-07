import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_NAME } from "@/src/lib/site";
import { notFound } from "next/navigation";
import { templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { parseSidebarCollapsedCookie, SIDEBAR_COOKIE_NAME } from "@/src/studio/sidebarCookie";
import { TemplateId } from "@/src/types/template";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  if (!(templateId in templateRegistry)) {
    return {};
  }
  const { meta } = templateRegistry[templateId as TemplateId];
  const description = `${meta.description} Create a ${meta.title} for LinkedIn and X. Free, no sign-up.`;
  const url = `/studio/${templateId}`;
  // openGraph/twitter replace the layout's objects rather than merging, so set every field.
  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${meta.title} · ${SITE_NAME}`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} · ${SITE_NAME}`,
      description,
    },
  };
}

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
