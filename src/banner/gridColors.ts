/**
 * The contribution grid's color presets: the "Grid colors" setting, saved as `themeId`. Not the
 * app's light/dark theme (src/theme/theme.ts).
 */
export interface GridColorPreset {
  id: string;
  label: string;
  /** Contribution cell colors, from no contributions to the most. */
  gridLevels: readonly [string, string, string, string, string];
}

export const GRID_COLOR_PRESETS = [
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
] as const satisfies readonly GridColorPreset[];

export type GridColorsId = (typeof GRID_COLOR_PRESETS)[number]["id"];

export const GRID_COLOR_IDS: readonly GridColorsId[] = GRID_COLOR_PRESETS.map(
  (preset) => preset.id,
);

export const DEFAULT_GRID_COLORS_ID: GridColorsId = "default";

/** The preset with this id, or the default preset. */
export function gridColorsById(id: unknown): GridColorPreset {
  return GRID_COLOR_PRESETS.find((preset) => preset.id === id) ?? GRID_COLOR_PRESETS[0];
}
