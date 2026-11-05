import { applySavedSettings, IMAGE_SETTINGS, removeImage } from "@/src/studio/savedSettings";
import { settingsCookie, USERNAME_COOKIE } from "@/src/studio/studioCookies";
import { templateRegistry } from "@/src/templates/registry";
import type { TemplateId } from "@/src/templates/types";

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

/** What the studio starts from: the banner's settings, and the username saved or linked. */
export interface StartingSettings {
  state: Record<string, unknown>;
  /** Null when none was saved or linked, so the studio asks for one. */
  username: string | null;
}

/**
 * The template's defaults with the saved settings and a studio link applied: what the server
 * renders (and loads GitHub data for) and what the browser starts from. `readCookie` reads a
 * cookie's raw value, on the server from the request and in the browser from `document.cookie`.
 */
export function startingSettings(
  templateId: TemplateId,
  readCookie: (name: string) => string | undefined,
  link: LinkSettings | null,
): StartingSettings {
  const settings = settingsCookie(templateId);
  const saved = withLink(
    {
      settings: settings.parse(readCookie(settings.name)),
      username: USERNAME_COOKIE.parse(readCookie(USERNAME_COOKIE.name)),
    },
    link,
  );
  return {
    state: applySavedSettings(
      { ...templateRegistry[templateId].initialState },
      templateId,
      saved.settings,
      saved.username,
    ),
    username: saved.username,
  };
}
