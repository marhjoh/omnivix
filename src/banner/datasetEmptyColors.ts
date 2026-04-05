import type { ThemePreset } from "@/src/types/theme";

/** Panel colors for dataset-empty states inside a themed banner (inset variant). */
export type BannerDatasetEmptyColors = {
  title: string;
  body: string;
  panelBackground: string;
  panelBorder: string;
};

export function themeToDatasetEmptyColors(theme: ThemePreset): BannerDatasetEmptyColors {
  return {
    title: theme.textPrimary,
    body: theme.textSecondary,
    panelBackground: `color-mix(in srgb, ${theme.surface} 72%, ${theme.background})`,
    panelBorder: `color-mix(in srgb, ${theme.textSecondary} 32%, transparent)`,
  };
}

/** GitHub profile banner: fixed chrome (matches Renderer constants). */
export const githubBannerFullscreenEmptyColors: Pick<BannerDatasetEmptyColors, "title" | "body"> = {
  title: "rgba(255,255,255,0.92)",
  body: "rgba(255,255,255,0.58)",
};
