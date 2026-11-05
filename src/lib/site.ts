import type { TemplateId } from "@/src/templates/types";

/** Site-wide name, copy and URL used for metadata and link previews. */
export const SITE_NAME = "Omnivix";

/** The title of the page shown when something breaks (app/error.tsx, app/global-error.tsx). */
export const ERROR_PAGE_TITLE = `Something broke · ${SITE_NAME}`;

/** The wordmark's size: the viewBox of public/brand/logo*.svg. */
export const BRAND_LOGO_SIZE = { width: 968, height: 274 } as const;

export const SITE_TAGLINE = "Create profile banners you actually want to use";

/** The best-known platforms, for copy that can't list all of them. */
export const SITE_PLATFORMS = "LinkedIn, X, Bluesky, Twitch";

export const SITE_DESCRIPTION = `Create ${SITE_PLATFORMS} and other banners from your GitHub profile, repos, contributions or a favorite quote. Free, no sign-up.`;

/**
 * Open Graph defaults. A page's `openGraph` replaces the layout's rather than merging, so pages
 * that set their own (with their `url`) spread this first.
 */
export const SITE_OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
} as const;

export const SITE_LICENSE = { name: "MIT", url: "https://opensource.org/licenses/MIT" } as const;

/**
 * Absolute base URL for metadata, which needs absolute URLs. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL (hostname only) on every deployment, previews included.
 */
export function getSiteUrl(): URL {
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) {
    return new URL(`https://${productionHost}`);
  }
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}

/** The studio page for a template, e.g. `/studio/github-banner`. */
export function studioPath(templateId: TemplateId): string {
  return `/studio/${templateId}`;
}

/** Shared outbound links for attribution and support (single source of truth). */
export const SITE_LINKS = {
  maintainerHandle: "marhjoh",
  maintainerProfile: "https://github.com/marhjoh",
  repo: "https://github.com/marhjoh/omnivix",
  newIssue: "https://github.com/marhjoh/omnivix/issues/new/choose",
  buyMeACoffee: "https://buymeacoffee.com/marhjoh",
} as const;
