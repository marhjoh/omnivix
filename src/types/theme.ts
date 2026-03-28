export interface ThemePreset {
  id: string;
  label: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  gridLevels: [string, string, string, string, string];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Default",
    background: "#0d1117",
    surface: "#161b22",
    textPrimary: "#e6edf3",
    textSecondary: "#8b949e",
    accent: "#3fb950",
    gridLevels: ["#1a222c", "#064320", "#008c38", "#1fb950", "#45f87a"],
  },
  {
    id: "alternate",
    label: "Alternate",
    background: "#1a0f14",
    surface: "#2d1b23",
    textPrimary: "#ffeef4",
    textSecondary: "#d6a3b5",
    accent: "#ff6b6b",
    gridLevels: ["#352028", "#6a2535", "#a3384a", "#e04d5c", "#ff7a7a"],
  },
  {
    id: "ocean",
    label: "Ocean",
    background: "#0a1628",
    surface: "#112240",
    textPrimary: "#ccd6f6",
    textSecondary: "#8892b0",
    accent: "#64ffda",
    gridLevels: ["#152535", "#1e5580", "#2890d8", "#58a6ff", "#8ecbff"],
  },
  {
    id: "midnight",
    label: "Midnight",
    background: "#0b1220",
    surface: "#111c30",
    textPrimary: "#e6edf3",
    textSecondary: "#8b9bb2",
    accent: "#2f81f7",
    gridLevels: ["#1c2840", "#2a5080", "#388bfd", "#33b14a", "#62f078"],
  },
  {
    id: "sunset",
    label: "Sunset",
    background: "#1f1524",
    surface: "#34203f",
    textPrimary: "#ffeef8",
    textSecondary: "#d8b7cb",
    accent: "#f778ba",
    gridLevels: ["#3d2a45", "#6c3560", "#a04578", "#d8568a", "#ff8fb8"],
  },
];
