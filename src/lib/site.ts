/** Site-wide name, copy and URL used for metadata and link previews. */
export const SITE_NAME = "Omnivix";

export const SITE_TAGLINE = "Create profile banners you actually want to use";

export const SITE_DESCRIPTION =
  "Create LinkedIn and X banners from your GitHub profile, repos, contributions or a favourite quote. Free, no sign-up.";

/**
 * Absolute base URL for metadata (Open Graph image links must be absolute).
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL (hostname only) on every deployment,
 * so previews also point link previews at production.
 */
export function getSiteUrl(): URL {
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) {
    return new URL(`https://${productionHost}`);
  }
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
