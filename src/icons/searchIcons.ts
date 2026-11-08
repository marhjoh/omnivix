import type { IconCatalogEntry } from "@/src/icons/iconSelection";

/** Lowercase, without spaces and dots, so "next.js", "Next JS" and "nextjs" all match. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s.]+/g, "");
}

/**
 * Icons whose name or slug contains `query`. Exact names come first, then names that start with
 * it, then shorter names.
 */
export function searchIcons(
  catalog: readonly IconCatalogEntry[],
  query: string,
  limit = 8,
): IconCatalogEntry[] {
  const needle = normalize(query);
  if (!needle) return [];
  const rank = (icon: IconCatalogEntry) => {
    const title = normalize(icon.title);
    if (title === needle || icon.slug === needle) return 0;
    if (title.startsWith(needle)) return 1;
    return 2;
  };
  return catalog
    .filter((icon) => normalize(icon.title).includes(needle) || icon.slug.includes(needle))
    .map((icon) => ({ icon, rank: rank(icon) }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.icon.title.length - b.icon.title.length ||
        a.icon.title.localeCompare(b.icon.title),
    )
    .slice(0, limit)
    .map(({ icon }) => icon);
}
