import "server-only";
import * as simpleIcons from "simple-icons";
import type { IconCatalogEntry, TechIcon } from "@/src/icons/iconSelection";

// Every icon's path is in this module, about 5 MB, so it stays on the server. The studio loads the
// catalog without paths, and the paths of only the icons it shows.

const ICONS = new Map(Object.values(simpleIcons).map((icon) => [icon.slug, icon]));

/** Every icon's slug, name and color, for the picker's search. */
export function iconCatalog(): IconCatalogEntry[] {
  return [...ICONS.values()].map(({ slug, title, hex }) => ({ slug, title, hex }));
}

/** The icons for these slugs, in the same order. Unknown slugs are left out. */
export function techIcons(slugs: readonly string[]): TechIcon[] {
  return slugs.flatMap((slug) => {
    const icon = ICONS.get(slug);
    return icon ? [{ slug, title: icon.title, hex: icon.hex, path: icon.path }] : [];
  });
}
