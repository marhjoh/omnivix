import { certificationIcons } from "@/src/banner/certifications";
import type { BannerSettings } from "@/src/templates/types";

/**
 * The Simple Icons a banner draws, as an `icons` setting. The intro banner's hidden icons aren't
 * included, so a failed load can't block a banner without them.
 */
export function drawnIcons(state: BannerSettings): string {
  if ("certifications" in state) return certificationIcons(state.certifications);
  if ("showIcons" in state && !state.showIcons) return "";
  return "icons" in state ? state.icons : "";
}
