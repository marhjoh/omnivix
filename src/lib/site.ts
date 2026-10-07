/** Site-wide name, copy and URL used for metadata and link previews. */
export const SITE_NAME = "Omnivix";

export const SITE_TAGLINE = "Create profile banners you actually want to use";

export const SITE_DESCRIPTION =
  "Create LinkedIn and X banners from your GitHub profile, repos, contributions or a favourite quote. Free, no sign-up.";

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
