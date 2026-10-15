import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_NAME } from "@/src/lib/site";
import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { parseSidebarCollapsedCookie, SIDEBAR_COOKIE_NAME } from "@/src/studio/sidebarCookie";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  if (!isTemplateId(templateId)) {
    return {};
  }
  const { meta } = templateRegistry[templateId];
  const description = `${meta.description} Create a ${meta.title} for LinkedIn, X, Bluesky, Twitch and more. Free, no sign-up.`;
  const url = `/studio/${templateId}`;
  const title = `${meta.title} · ${SITE_NAME}`;
  // openGraph/twitter replace the layout's objects rather than merging, so set every field.
  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StudioPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  if (!isTemplateId(templateId)) {
    notFound();
  }
  const cookieStore = await cookies();
  const sidebarCollapsed = parseSidebarCollapsedCookie(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value);
  return (
    <StudioShell
      key={templateId}
      templateId={templateId}
      initialSidebarCollapsed={sidebarCollapsed}
    />
  );
}
