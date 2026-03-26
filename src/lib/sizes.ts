import { BannerSize } from "@/src/types/template";

export const BANNER_SIZES: Record<
  BannerSize,
  { label: string; width: number; height: number; icon: string }
> = {
  linkedinCover: { label: "LinkedIn", width: 1584, height: 396, icon: "linkedin" },
  xHeader: { label: "X / Twitter", width: 1500, height: 500, icon: "twitter" },
};
