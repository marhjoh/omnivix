/**
 * Skyline preset images live in `public/backgrounds/*.jpg` (served as `/backgrounds/...`).
 *
 * Sources: Unsplash (https://unsplash.com/license) — vendored in-repo for reliable export/preview.
 * Labels are thematic; swap files or `src` paths to match your own photography or licensing needs.
 */
export interface BackgroundPreset {
  id: string;
  label: string;
  group: string;
  /** Public path served from /public */
  src: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "chicago", label: "Chicago", group: "Skylines", src: "/backgrounds/chicago.jpg" },
  { id: "los-angeles", label: "Los Angeles", group: "Skylines", src: "/backgrounds/los-angeles.jpg" },
  { id: "montreal", label: "Montreal", group: "Skylines", src: "/backgrounds/montreal.jpg" },
  { id: "new-york-day", label: "New York (Day)", group: "Skylines", src: "/backgrounds/new-york-day.jpg" },
  { id: "new-york-night", label: "New York (Night)", group: "Skylines", src: "/backgrounds/new-york-night.jpg" },
  { id: "seattle-day", label: "Seattle (Day)", group: "Skylines", src: "/backgrounds/seattle-day.jpg" },
  { id: "seattle-night", label: "Seattle (Night)", group: "Skylines", src: "/backgrounds/seattle-night.jpg" },
  { id: "toronto-day", label: "Toronto (Day)", group: "Skylines", src: "/backgrounds/toronto-day.jpg" },
  { id: "toronto-night", label: "Toronto (Night)", group: "Skylines", src: "/backgrounds/toronto-night.jpg" },
  { id: "vancouver", label: "Vancouver", group: "Skylines", src: "/backgrounds/vancouver.jpg" },
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
