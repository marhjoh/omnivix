/** A Simple Icons brand icon, as the tech stack and intro banners draw it. */
export interface TechIcon {
  slug: string;
  title: string;
  /** The brand color, without `#`. */
  hex: string;
  /** An SVG path on a 24 × 24 grid. */
  path: string;
}

/** What the icon picker searches. */
export type IconCatalogEntry = Omit<TechIcon, "path">;

/** A banner shows at most this many icons. */
export const MAX_ICONS = 24;

/** Simple Icons slugs are lowercase letters and digits, and a few have an underscore. */
const ICON_SLUG = /^[a-z0-9_]{1,50}$/;

/** Slugs from a comma-separated `icons` setting, in order. */
export function parseIconSelection(value: string): string[] {
  return value
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

/**
 * The loaded icons in the setting's order. Icons still loading, or that Simple Icons doesn't have,
 * are left out. `icons` may also hold icons that were removed from the setting since.
 */
export function iconsInOrder(value: string, icons: readonly TechIcon[] = []): TechIcon[] {
  const bySlug = new Map(icons.map((icon) => [icon.slug, icon]));
  return parseIconSelection(value).flatMap((slug) => bySlug.get(slug) ?? []);
}

/**
 * True for at most MAX_ICONS slugs, comma-separated, each once. It only checks their form, because
 * the browser doesn't have the icon list. Slugs Simple Icons doesn't have are left out when drawing.
 */
export function isIconSelection(value: string): boolean {
  const slugs = parseIconSelection(value);
  return (
    slugs.length <= MAX_ICONS &&
    new Set(slugs).size === slugs.length &&
    slugs.every((slug) => ICON_SLUG.test(slug))
  );
}

/**
 * The URL the studio loads the selected icons from, or null for none. Sorted, so reordering the
 * icons reuses the same request.
 */
export function iconsUrl(value: string): string | null {
  const slugs = parseIconSelection(value).toSorted();
  return slugs.length ? `/api/icons?slugs=${slugs.join(",")}` : null;
}

/** The catalog the icon picker searches. */
export const ICON_CATALOG_URL = "/api/icons/catalog";
