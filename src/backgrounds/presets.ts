/**
 * Background presets live in `public/backgrounds/` (served as `/backgrounds/...`).
 *
 * Photos are from Unsplash (https://unsplash.com/license), vendored in-repo for reliable export and
 * preview. `pnpm backgrounds` regenerates them; see `scripts/backgrounds.mts`. The abstract SVGs
 * are hand-written.
 */
interface BackgroundPreset {
  id: string;
  label: string;
  group: string;
  /** Public path served from /public */
  src: string;
  /** For photo presets: photographer, Unsplash photo page, and the image on Unsplash's CDN. */
  credit?: { author: string; url: string; image: string };
  /**
   * Default background position in percent (CSS `object-position`), chosen so the subject stays in
   * frame at every banner size. Defaults to the center.
   */
  focus?: { x: number; y: number };
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "london",
    label: "London",
    group: "Cities",
    src: "/backgrounds/london.avif",
    credit: {
      author: "Benjamin Davies",
      url: "https://unsplash.com/photos/Oja2ty_9ZLM",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad",
    },
    focus: { x: 30, y: 85 },
  },
  {
    id: "new-york",
    label: "New York",
    group: "Cities",
    src: "/backgrounds/new-york.avif",
    credit: {
      author: "Mike Chavarri",
      url: "https://unsplash.com/photos/kZokA2VTKn4",
      image: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b",
    },
    focus: { x: 50, y: 45 },
  },
  {
    id: "chicago",
    label: "Chicago",
    group: "Cities",
    src: "/backgrounds/chicago.avif",
    credit: {
      author: "Max Bender",
      url: "https://unsplash.com/photos/VmX3vmBecFE",
      image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390",
    },
  },
  {
    id: "toronto",
    label: "Toronto",
    group: "Cities",
    src: "/backgrounds/toronto.avif",
    credit: {
      author: "Sandro Schuh",
      url: "https://unsplash.com/photos/6wVqCeK030Y",
      image: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f",
    },
    focus: { x: 50, y: 70 },
  },
  {
    id: "lisbon",
    label: "Lisbon",
    group: "Cities",
    src: "/backgrounds/lisbon.avif",
    credit: {
      author: "Aleksandr Zaitsev",
      url: "https://unsplash.com/photos/zEFfW3kXQR8",
      image: "https://images.unsplash.com/photo-1748279944004-f1d733dc711b",
    },
    focus: { x: 50, y: 70 },
  },
  {
    id: "seoul",
    label: "Seoul",
    group: "Cities",
    src: "/backgrounds/seoul.avif",
    credit: {
      author: "Ping Onganankun",
      url: "https://unsplash.com/photos/5htrsUUbFGI",
      image: "https://images.unsplash.com/photo-1532649097480-b67d52743b69",
    },
    focus: { x: 50, y: 60 },
  },
  {
    id: "sydney",
    label: "Sydney",
    group: "Cities",
    src: "/backgrounds/sydney.avif",
    credit: {
      author: "Joshua Delica",
      url: "https://unsplash.com/photos/9FqNt_8Mg0U",
      image: "https://images.unsplash.com/photo-1667992501579-b6d13aedca18",
    },
    focus: { x: 50, y: 35 },
  },
  {
    id: "swiss-alps",
    label: "Swiss Alps",
    group: "Nature",
    src: "/backgrounds/swiss-alps.avif",
    credit: {
      author: "Sam Ferrara",
      url: "https://unsplash.com/photos/1527pjeb6jg",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    },
    focus: { x: 50, y: 45 },
  },
  {
    id: "norwegian-fjord",
    label: "Norwegian Fjord",
    group: "Nature",
    src: "/backgrounds/norwegian-fjord.avif",
    credit: {
      author: "Robert Bye",
      url: "https://unsplash.com/photos/e1sTn8-hGEE",
      image: "https://images.unsplash.com/photo-1505731324189-3d0afbeafcbf",
    },
    focus: { x: 50, y: 60 },
  },
  {
    id: "sahara",
    label: "Sahara Dunes",
    group: "Nature",
    src: "/backgrounds/sahara.avif",
    credit: {
      author: "Emma Van Sant",
      url: "https://unsplash.com/photos/GkIGSLW04Nc",
      image: "https://images.unsplash.com/photo-1617374128851-c84e37dc9f37",
    },
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
