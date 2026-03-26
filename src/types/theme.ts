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
    gridLevels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  {
    id: "alternate",
    label: "Alternate",
    background: "#1a0f14",
    surface: "#2d1b23",
    textPrimary: "#ffeef4",
    textSecondary: "#d6a3b5",
    accent: "#ff6b6b",
    gridLevels: ["#2d1b23", "#5c2030", "#8b2e40", "#c84250", "#ff6b6b"],
  },
  {
    id: "ocean",
    label: "Ocean",
    background: "#0a1628",
    surface: "#112240",
    textPrimary: "#ccd6f6",
    textSecondary: "#8892b0",
    accent: "#64ffda",
    gridLevels: ["#112240", "#1a4a6e", "#2176a5", "#58a6ff", "#79c0ff"],
  },
  {
    id: "midnight",
    label: "Midnight",
    background: "#0b1220",
    surface: "#111c30",
    textPrimary: "#e6edf3",
    textSecondary: "#8b9bb2",
    accent: "#2f81f7",
    gridLevels: ["#1a2438", "#264262", "#1f6feb", "#2ea043", "#56d364"],
  },
  {
    id: "sunset",
    label: "Sunset",
    background: "#1f1524",
    surface: "#34203f",
    textPrimary: "#ffeef8",
    textSecondary: "#d8b7cb",
    accent: "#f778ba",
    gridLevels: ["#3a283f", "#623057", "#8f3d68", "#c24973", "#ff7ea7"],
  },
];
