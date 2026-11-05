// Settings the scripts share.
import { SITE_LINKS } from "@/src/lib/site";

/** The running app the scripts talk to: `pnpm dev`, unless BASE_URL says otherwise. */
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/** The GitHub user whose banners the scripts render. */
export const USERNAME = SITE_LINKS.maintainerHandle;

/** A laptop screen, for full-page captures. */
export const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/** "123 KB", for the sizes the scripts log. */
export function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}
