import { IMAGE_SETTINGS, removeImage } from "@/src/studio/savedSettings";

/** Settings from a studio link, with the username apart (it's saved for every template). */
export interface LinkSettings {
  settings: Record<string, unknown>;
  username: string | null;
}

/**
 * Saved settings with a link's applied over them. A linked image replaces the saved settings that
 * belong to the saved image, such as a background's position and zoom.
 */
export function withLink(
  saved: { settings: Record<string, unknown> | null; username: string | null },
  link: LinkSettings | null,
): { settings: Record<string, unknown> | null; username: string | null } {
  if (!link) return saved;
  const settings = { ...saved.settings };
  for (const key of Object.keys(IMAGE_SETTINGS)) {
    if (key in link.settings) removeImage(settings, key);
  }
  return { settings: { ...settings, ...link.settings }, username: link.username ?? saved.username };
}
