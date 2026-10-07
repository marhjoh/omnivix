import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerSize } from "@/src/types/template";

/** Pixel ratio the studio exports at; the landing FAQ quotes it. */
export const EXPORT_PIXEL_RATIO = 3;

export function getViewport(size: BannerSize, pixelRatio: 1 | 2 | 3 = 3) {
  const dims = BANNER_SIZES[size];
  return {
    width: dims.width,
    height: dims.height,
    deviceScaleFactor: pixelRatio,
  };
}
