import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SITE_NAME, SITE_PLATFORMS } from "@/src/lib/site";
import { notFound } from "next/navigation";
import { isTemplateId, templateRegistry } from "@/src/templates/registry";
import { StudioShell } from "@/src/studio/StudioShell";
import { ThemeProvider } from "@/src/theme/ThemeProvider";
import { parseThemeCookie, THEME_COOKIE_NAME } from "@/src/theme/theme";
import { parseSidebarCollapsedCookie, SIDEBAR_COOKIE_NAME } from "@/src/studio/sidebarCookie";
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
  return (
    // The banner preview picks its colors in JavaScript, so the theme must be right on the server.
    <ThemeProvider initialTheme={parseThemeCookie(cookieStore.get(THEME_COOKIE_NAME)?.value)}>
      <StudioShell
        key={templateId}
        templateId={templateId}
        initialSidebarCollapsed={parseSidebarCollapsedCookie(
          cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
        )}
        savedSettings={parseSettingsCookie(cookieStore.get(settingsCookieName(templateId))?.value)}
        savedUsername={parseUsernameCookie(cookieStore.get(USERNAME_COOKIE)?.value)}
      />
    </ThemeProvider>
  );
}
