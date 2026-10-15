/**
 * Background presets live in `public/backgrounds/` (served as `/backgrounds/...`).
 *
 * Photos are from Unsplash (https://unsplash.com/license), vendored in-repo for reliable export and
 * preview. `pnpm backgrounds` regenerates them; see `scripts/backgrounds.mts`. The abstract SVGs
 * are hand-written. Old preset paths redirect to these in `next.config.ts`.
 */
export interface BackgroundPreset {
  id: string;
  label: string;
  group: string;
  /** Public path served from /public */
  src: string;
  /** Photographer and Unsplash photo page, for photo presets. */
  credit?: { author: string; url: string };
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "london",
    label: "London",
    group: "Cities",
    src: "/backgrounds/london.avif",
    credit: { author: "Benjamin Davies", url: "https://unsplash.com/photos/Oja2ty_9ZLM" },
  },
  {
    id: "new-york",
    label: "New York",
    group: "Cities",
    src: "/backgrounds/new-york.avif",
    credit: { author: "Mike Chavarri", url: "https://unsplash.com/photos/kZokA2VTKn4" },
  },
  {
    id: "chicago",
    label: "Chicago",
    group: "Cities",
    src: "/backgrounds/chicago.avif",
    credit: { author: "Max Bender", url: "https://unsplash.com/photos/VmX3vmBecFE" },
  },
  {
    id: "toronto",
    label: "Toronto",
    group: "Cities",
    src: "/backgrounds/toronto.avif",
    credit: { author: "Sandro Schuh", url: "https://unsplash.com/photos/6wVqCeK030Y" },
  },
  {
    id: "lisbon",
    label: "Lisbon",
    group: "Cities",
    src: "/backgrounds/lisbon.avif",
    credit: { author: "Aleksandr Zaitsev", url: "https://unsplash.com/photos/zEFfW3kXQR8" },
  },
  {
    id: "seoul",
    label: "Seoul",
    group: "Cities",
    src: "/backgrounds/seoul.avif",
    credit: { author: "Ping Onganankun", url: "https://unsplash.com/photos/5htrsUUbFGI" },
  },
  {
    id: "sydney",
    label: "Sydney",
    group: "Cities",
    src: "/backgrounds/sydney.avif",
    credit: { author: "Joshua Delica", url: "https://unsplash.com/photos/9FqNt_8Mg0U" },
  },
  {
    id: "swiss-alps",
    label: "Swiss Alps",
    group: "Nature",
    src: "/backgrounds/swiss-alps.avif",
    credit: { author: "Sam Ferrara", url: "https://unsplash.com/photos/1527pjeb6jg" },
  },
  {
    id: "norwegian-fjord",
    label: "Norwegian Fjord",
    group: "Nature",
    src: "/backgrounds/norwegian-fjord.avif",
    credit: { author: "Robert Bye", url: "https://unsplash.com/photos/e1sTn8-hGEE" },
  },
  {
    id: "sahara",
    label: "Sahara Dunes",
    group: "Nature",
    src: "/backgrounds/sahara.avif",
    credit: { author: "Emma Van Sant", url: "https://unsplash.com/photos/GkIGSLW04Nc" },
  },
  { id: "aurora", label: "Aurora", group: "Abstract", src: "/backgrounds/aurora.svg" },
  {
    id: "sunset-mesh",
    label: "Sunset Gradient",
    group: "Abstract",
    src: "/backgrounds/sunset-mesh.svg",
  },
  { id: "waves", label: "Waves", group: "Abstract", src: "/backgrounds/waves.svg" },
  { id: "dot-grid", label: "Dot Grid", group: "Abstract", src: "/backgrounds/dot-grid.svg" },
];

export function presetBySrc(src: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((p) => p.src === src);
}

export function groupPresets(presets: BackgroundPreset[]): Map<string, BackgroundPreset[]> {
  const map = new Map<string, BackgroundPreset[]>();
  for (const p of presets) {
    const list = map.get(p.group) ?? [];
    list.push(p);
    map.set(p.group, list);
  }
  return map;
}
