import { BANNER_SIZES } from "@/src/lib/sizes";
import { BannerSize } from "@/src/types/template";

export function getViewport(size: BannerSize, pixelRatio: 1 | 2 | 3 = 3) {
  const dims = BANNER_SIZES[size];
  return {
    width: dims.width,
    height: dims.height,
    deviceScaleFactor: pixelRatio,
  };
}
