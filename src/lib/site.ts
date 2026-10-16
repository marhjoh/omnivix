/** Site-wide name, copy and URL used for metadata and link previews. */
export const SITE_NAME = "Omnivix";

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
