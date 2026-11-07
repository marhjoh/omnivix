import { applySavedSettings, IMAGE_SETTINGS, removeImage } from "@/src/studio/savedSettings";
import { settingsCookie, USERNAME_COOKIE } from "@/src/studio/studioCookies";
import { templateRegistry } from "@/src/templates/registry";
import type { StudioSettings, TemplateId } from "@/src/templates/types";

/** Settings from a studio link. The username is separate because it's saved for all templates. */
export interface LinkSettings {
  settings: Record<string, unknown>;
  username: string | null;
}

/**
 * Applies a link's settings over the saved ones. A linked image also drops the settings that
 * belong to the saved image, such as the background's position and zoom.
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

export interface StartingSettings {
  state: StudioSettings;
  /** Null if no username was saved or linked. The studio then asks for one. */
  username: string | null;
}

/**
 * The template defaults with the saved settings and the link applied on top. The server render and
 * the browser both start from this. `readCookie` returns a cookie's raw value: from the request on
 * the server, and from `document.cookie` in the browser.
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
