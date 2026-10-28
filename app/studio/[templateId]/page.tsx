import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_NAME, SITE_OPEN_GRAPH, SITE_PLATFORMS } from "@/src/lib/site";
import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { applySavedSettings } from "@/src/studio/savedSettings";
import { parseLinkSettings, withLink } from "@/src/studio/linkSettings";
import { loadInitialGithubData } from "@/src/studio/initialGithubData";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { parseThemeCookie, THEME_COOKIE_NAME } from "@/src/theme/theme";
import { parseSidebarCollapsedCookie, SIDEBAR_COOKIE_NAME } from "@/src/studio/sidebarCookie";
import { parsePreviewViewCookie, PREVIEW_VIEW_COOKIE_NAME } from "@/src/studio/previewViewCookie";
import {
  FORMAT_COOKIE_NAME,
  parseFormatCookie,
  parsePixelRatioCookie,
  PIXEL_RATIO_COOKIE_NAME,
} from "@/src/studio/downloadCookies";
import {
  parseSettingsCookie,
  parseUsernameCookie,
  settingsCookieName,
  USERNAME_COOKIE,
} from "@/src/studio/studioCookies";

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
  const description = `${meta.description} Create a ${meta.title} for ${SITE_PLATFORMS} and more. Free, no sign-up.`;
  const url = `/studio/${templateId}`;
  const title = `${meta.title} · ${SITE_NAME}`;
  // twitter replaces the layout's object rather than merging, so set every field.
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
  const savedSettings = parseSettingsCookie(cookieStore.get(settingsCookieName(templateId))?.value);
  const savedUsername = parseUsernameCookie(cookieStore.get(USERNAME_COOKIE)?.value);
  // A studio link's settings win over the saved ones (see linkSettings.ts).
  const link = parseLinkSettings(templateId, await searchParams);
  const start = withLink({ settings: savedSettings, username: savedUsername }, link);
  // The same settings the studio starts from, so the GitHub data matches what it shows.
  const initialState = applySavedSettings(
    { ...templateRegistry[templateId].initialState },
    templateId,
    start.settings,
    start.username,
  );
  const initialGithubData = await loadInitialGithubData(templateId, initialState);
  return (
    // The banner preview picks its colors in JavaScript, so the theme must be right on the server.
    <ThemeProvider initialTheme={parseThemeCookie(cookieStore.get(THEME_COOKIE_NAME)?.value)}>
      <StudioShell
        key={templateId}
        templateId={templateId}
        initialSidebarCollapsed={parseSidebarCollapsedCookie(
          cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
        )}
        initialPixelRatio={parsePixelRatioCookie(cookieStore.get(PIXEL_RATIO_COOKIE_NAME)?.value)}
        initialFormat={parseFormatCookie(cookieStore.get(FORMAT_COOKIE_NAME)?.value)}
        initialPreviewView={parsePreviewViewCookie(
          cookieStore.get(PREVIEW_VIEW_COOKIE_NAME)?.value,
        )}
        savedSettings={savedSettings}
        savedUsername={savedUsername}
        link={link}
        initialGithubData={initialGithubData}
      />
    </ThemeProvider>
  );
}
