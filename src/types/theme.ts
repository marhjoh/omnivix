export interface ThemePreset {
  id: string;
  label: string;
  /** Contribution cell colors, from no contributions to the most. */
  gridLevels: [string, string, string, string, string];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Default",
    gridLevels: ["#1a222c", "#064320", "#008c38", "#1fb950", "#45f87a"],
  },
  {
    id: "alternate",
    label: "Alternate",
    gridLevels: ["#352028", "#6a2535", "#a3384a", "#e04d5c", "#ff7a7a"],
  },
  {
    id: "ocean",
    label: "Ocean",
    gridLevels: ["#152535", "#1e5580", "#2890d8", "#58a6ff", "#8ecbff"],
  },
  {
    id: "sunset",
    label: "Sunset",
    gridLevels: ["#3d2a45", "#6c3560", "#a04578", "#d8568a", "#ff8fb8"],
  },
];

/** The preset with this id, or the default preset. */
export function themePresetById(id: unknown): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0];
}
