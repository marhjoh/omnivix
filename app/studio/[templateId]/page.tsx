import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_NAME, SITE_OPEN_GRAPH, SITE_PLATFORMS, studioPath } from "@/src/lib/site";
import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { StudioQueryProvider } from "@/src/studio/StudioQueryProvider";
import { startingSettings } from "@/src/studio/linkSettings";
import { parseLinkSettings } from "@/src/studio/parseLinkSettings";
import { loadInitialApiData } from "@/src/studio/initialApiData";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { parseThemeCookie, THEME_COOKIE_NAME } from "@/src/theme/theme";
import {
  FORMAT_COOKIE,
  PIXEL_RATIO_COOKIE,
  PREVIEW_VIEW_COOKIE,
  SIDEBAR_COOKIE,
  type StudioCookie,
} from "@/src/studio/studioCookies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  // The page's notFound() doesn't bring in not-found.tsx's title.
  if (!isTemplateId(templateId)) {
    return { title: "Page not found" };
  }
  const { meta } = templateRegistry[templateId];
  const article = /^[aeiou]/i.test(meta.title) ? "an" : "a";
  const description = `${meta.description} Create ${article} ${meta.title} for ${SITE_PLATFORMS} and more. Free, no sign-up.`;
  const url = studioPath(templateId);
  const title = `${meta.title} · ${SITE_NAME}`;
  // Next replaces the layout's twitter object instead of merging it, so set every field.
  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: { ...SITE_OPEN_GRAPH, title, description, url },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { templateId } = await params;
  if (!isTemplateId(templateId)) {
    notFound();
  }
  const cookieStore = await cookies();
  const readCookie = (name: string) => cookieStore.get(name)?.value;
  const read = <T,>(cookie: StudioCookie<T>) => cookie.parse(readCookie(cookie.name));
  // A studio link's settings win over the saved ones (see linkSettings.ts).
  const link = parseLinkSettings(templateId, await searchParams);
  const start = startingSettings(templateId, readCookie, link);
  // Load data for the starting settings, so the first paint shows the banner.
  const initialApiData = await loadInitialApiData(templateId, start.state);
  return (
    // The banner preview picks its colors in JavaScript, so the theme must be right on the server.
    <ThemeProvider initialTheme={parseThemeCookie(readCookie(THEME_COOKIE_NAME))}>
      <StudioQueryProvider>
        <StudioShell
          key={templateId}
          templateId={templateId}
          initialSidebarCollapsed={read(SIDEBAR_COOKIE)}
          initialPixelRatio={read(PIXEL_RATIO_COOKIE)}
          initialFormat={read(FORMAT_COOKIE)}
          initialPreviewView={read(PREVIEW_VIEW_COOKIE)}
          start={start}
          link={link}
          initialApiData={initialApiData}
        />
      </StudioQueryProvider>
    </ThemeProvider>
  );
}
